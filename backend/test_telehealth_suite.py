import os
import sys
import django
from datetime import datetime, timedelta, time
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.doctors.models import DoctorProfile, Specialty
from apps.doctors.views import DoctorViewSet
from apps.appointments.models import DoctorAvailability, DoctorBlockedDate, Appointment
from apps.appointments.views import AppointmentViewSet
from apps.notifications.models import Notification

User = get_user_model()

def run_telehealth_tests():
    print("=" * 60)
    print("STARTING TELEHEALTH VERIFICATION TEST SUITE")
    print("=" * 60)

    rf = APIRequestFactory()
    patient = User.objects.get(email='customer@mediswift.in')

    # Test 1: Doctor Discovery & Filters
    print("\n--- TEST 1: Doctor Discovery & Search Filters ---")
    view_doc = DoctorViewSet.as_view({'get': 'list'})
    
    # 1a. List all doctors
    req = rf.get('/api/v1/doctors/')
    res = view_doc(req)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    results_list = res.data['data']['results'] if 'data' in res.data and isinstance(res.data['data'], dict) and 'results' in res.data['data'] else res.data.get('results', [])
    doc_count = len(results_list)
    print(f"[PASS] All Doctors count: {doc_count}")
    assert doc_count >= 8, f"Expected at least 8 seeded doctors, got {doc_count}"

    # 1b. Filter by specialty (Cardiology)
    req = rf.get('/api/v1/doctors/?specialty=cardiologist')
    res = view_doc(req)
    assert res.status_code == 200
    cardio_results = res.data['data']['results'] if 'data' in res.data and isinstance(res.data['data'], dict) and 'results' in res.data['data'] else res.data.get('results', [])
    print(f"[PASS] Specialty filter (cardiologist): found {len(cardio_results)} doctor(s)")
    assert len(cardio_results) >= 1
    assert any("Rajesh Iyer" in d['doctor_name'] for d in cardio_results)

    # 1c. Filter by city & telehealth
    req = rf.get('/api/v1/doctors/?city=New Delhi&telehealth_only=true')
    res = view_doc(req)
    assert res.status_code == 200
    delhi_results = res.data['data']['results'] if 'data' in res.data and isinstance(res.data['data'], dict) and 'results' in res.data['data'] else res.data.get('results', [])
    print(f"[PASS] Filter by City (New Delhi) & Telehealth: found {len(delhi_results)} doctor(s)")
    assert len(delhi_results) >= 1

    # 1d. Search by keyword
    req = rf.get('/api/v1/doctors/?search=AIIMS')
    res = view_doc(req)
    assert res.status_code == 200
    search_results = res.data['data']['results'] if 'data' in res.data and isinstance(res.data['data'], dict) and 'results' in res.data['data'] else res.data.get('results', [])
    print(f"[PASS] Search query 'AIIMS': found {len(search_results)} doctor(s)")
    assert len(search_results) >= 1

    # Test 2: Doctor Profile Detail Lookup
    print("\n--- TEST 2: Doctor Profile Lookup by Slug & ID ---")
    doc_arjun = DoctorProfile.objects.filter(user__first_name='Arjun').first()
    assert doc_arjun is not None, "Dr. Arjun Sharma not found"
    
    view_doc_detail = DoctorViewSet.as_view({'get': 'retrieve'})
    
    # By slug
    req = rf.get(f'/api/v1/doctors/{doc_arjun.slug}/')
    res = view_doc_detail(req, pk=doc_arjun.slug)
    assert res.status_code == 200
    assert res.data['doctor_name'] == 'Arjun Sharma'
    assert res.data['slug'] == doc_arjun.slug
    print(f"[PASS] Slug lookup successful: {res.data['doctor_name']} ({res.data['slug']})")

    # By UUID id
    req = rf.get(f'/api/v1/doctors/{doc_arjun.id}/')
    res = view_doc_detail(req, pk=str(doc_arjun.id))
    assert res.status_code == 200
    assert res.data['id'] == str(doc_arjun.id)
    print(f"[PASS] UUID lookup successful: ID={res.data['id']}")

    # Test 3: Dynamic Available Slots Calculation
    print("\n--- TEST 3: Dynamic Slot Generation & Logic ---")
    view_slots = AppointmentViewSet.as_view({'get': 'available_slots'})
    
    # Test next weekday with break
    target_weekday = timezone.localtime().date() + timedelta(days=1)
    while target_weekday.weekday() > 4: # Mon-Fri
        target_weekday += timedelta(days=1)
    test_date_str = target_weekday.strftime('%Y-%m-%d')
    req = rf.get(f'/api/v1/appointments/available-slots/?doctor_id={doc_arjun.slug}&date={test_date_str}')
    res = view_slots(req)
    assert res.status_code == 200
    slots_payload = res.data['data']
    print(f"[PASS] Date: {test_date_str} ({slots_payload['weekday']})")
    print(f"[PASS] Total slots: {slots_payload['total_slots']}, Available: {slots_payload['available_count']}")
    assert slots_payload['total_slots'] > 0
    
    # Verify break periods (13:00 - 14:00) are unavailable
    lunch_slot = next((s for s in slots_payload['slots'] if s['time'] == '13:00'), None)
    if lunch_slot:
        assert not lunch_slot['available'], "Lunch slot at 13:00 should be marked unavailable"
        print(f"[PASS] Verified break period slot is marked unavailable: {lunch_slot['reason']}")

    # Test past date rejection
    yesterday = (timezone.localtime().date() - timedelta(days=1)).strftime('%Y-%m-%d')
    req = rf.get(f'/api/v1/appointments/available-slots/?doctor_id={doc_arjun.slug}&date={yesterday}')
    res = view_slots(req)
    assert res.status_code == 200
    assert res.data['data']['slots'] == []
    print("[PASS] Verified past date rejection: 0 slots returned")

    # Test 4: Booking & Concurrency Double-Booking Prevention
    print("\n--- TEST 4: Transaction-Safe Booking & Double-Booking Prevention ---")
    view_booking = AppointmentViewSet.as_view({'post': 'create'})

    # Pick a future weekday timestamp for booking (next week Tuesday at 10:30 AM)
    target_date = timezone.localtime().date() + timedelta(days=5)
    while target_date.weekday() > 4: # ensure Mon-Fri
        target_date += timedelta(days=1)
    
    book_time = timezone.make_aware(datetime.combine(target_date, time(10, 30)))
    
    # Clean up any leftover test appointment at this slot
    Appointment.objects.filter(doctor=doc_arjun, scheduled_at=book_time).delete()

    # Patient books slot
    req1 = rf.post('/api/v1/appointments/', {
        'doctor': str(doc_arjun.id),
        'scheduled_at': book_time.isoformat(),
        'consultation_type': 'VIDEO',
        'symptoms': 'Routine quarterly cardiovascular review'
    })
    force_authenticate(req1, user=patient)
    res1 = view_booking(req1)
    assert res1.status_code == 201, f"Booking failed with {res1.status_code}: {res1.data}"
    appt_id = res1.data['data']['id']
    booking_ref = res1.data['data']['booking_reference']
    print(f"[PASS] Booking 1 created: Ref={booking_ref}, Fee={res1.data['data']['fee_amount']}")

    # Second user attempts booking identical slot -> Must be rejected with 409 Conflict
    other_patient, _ = User.objects.get_or_create(email='other_patient@mediswift.in', defaults={'first_name': 'Other', 'last_name': 'User'})
    req2 = rf.post('/api/v1/appointments/', {
        'doctor': str(doc_arjun.id),
        'scheduled_at': book_time.isoformat(),
        'consultation_type': 'VIDEO',
        'symptoms': 'Checkup'
    })
    force_authenticate(req2, user=other_patient)
    res2 = view_booking(req2)
    assert res2.status_code == 409, f"Expected 409 Conflict, got {res2.status_code}"
    print(f"[PASS] Double-booking rejected: Status={res2.status_code}, Message='{res2.data['message']}'")

    # Verify slot is now unavailable on that date
    req_slots_check = rf.get(f'/api/v1/appointments/available-slots/?doctor_id={doc_arjun.slug}&date={target_date.strftime("%Y-%m-%d")}')
    res_slots_check = view_slots(req_slots_check)
    booked_slot_item = next((s for s in res_slots_check.data['data']['slots'] if s['time'] == '10:30'), None)
    assert booked_slot_item is not None
    assert not booked_slot_item['available']
    assert booked_slot_item['reason'] == 'Already Booked'
    print(f"[PASS] Slot 10:30 dynamically marked unavailable in calendar: '{booked_slot_item['reason']}'")

    # Test 5: Rescheduling
    print("\n--- TEST 5: Rescheduling Architecture ---")
    view_reschedule = AppointmentViewSet.as_view({'post': 'reschedule'})
    new_book_time = timezone.make_aware(datetime.combine(target_date, time(11, 00)))
    
    req_reschedule = rf.post(f'/api/v1/appointments/{appt_id}/reschedule/', {
        'new_scheduled_at': new_book_time.isoformat(),
        'reason': 'Changed flight schedule'
    })
    force_authenticate(req_reschedule, user=patient)
    res_reschedule = view_reschedule(req_reschedule, pk=appt_id)
    assert res_reschedule.status_code == 200, f"Reschedule failed: {res_reschedule.data}"
    assert res_reschedule.data['data']['status'] == 'RESCHEDULED'
    print(f"[PASS] Rescheduled successfully to: {res_reschedule.data['data']['scheduled_at']}")

    # Verify old slot 10:30 is now released and free again!
    res_slots_after = view_slots(req_slots_check)
    old_slot_item = next((s for s in res_slots_after.data['data']['slots'] if s['time'] == '10:30'), None)
    assert old_slot_item is not None and old_slot_item['available'], "Old slot should be released after reschedule"
    print("[PASS] Old slot 10:30 was freed and is available again")

    # Test 6: Cancellation Policy & Audit Record
    print("\n--- TEST 6: Cancellation Policy & Audit Trail ---")
    view_cancel = AppointmentViewSet.as_view({'post': 'cancel'})
    req_cancel = rf.post(f'/api/v1/appointments/{appt_id}/cancel/', {
        'reason': 'Condition improved without medication'
    })
    force_authenticate(req_cancel, user=patient)
    res_cancel = view_cancel(req_cancel, pk=appt_id)
    assert res_cancel.status_code == 200
    assert res_cancel.data['data']['status'] == 'CANCELLED'
    assert res_cancel.data['data']['cancellation_reason'] == 'Condition improved without medication'
    print(f"[PASS] Appointment cancelled with audit reason: '{res_cancel.data['data']['cancellation_reason']}'")

    # Verify cancelled appointment was not permanently deleted (audit record retained)
    appt_record = Appointment.objects.get(id=appt_id)
    assert appt_record.status == Appointment.Status.CANCELLED
    assert appt_record.cancelled_at is not None
    print(f"[PASS] Appointment record preserved in database with timestamp: {appt_record.cancelled_at}")

    # Test 7: Authorization & Security
    print("\n--- TEST 7: Authorization & Telehealth Meeting Link Privacy ---")
    # Anonymous request must not see meeting_url
    view_detail = AppointmentViewSet.as_view({'get': 'retrieve'})
    req_anon = rf.get(f'/api/v1/appointments/{appt_id}/')
    res_anon = view_detail(req_anon, pk=appt_id)
    assert res_anon.status_code == 401, "Anonymous user must be rejected with 401"
    print("[PASS] Anonymous access rejected with 401")

    # Other patient must not see this patient's appointment
    req_other = rf.get(f'/api/v1/appointments/{appt_id}/')
    force_authenticate(req_other, user=other_patient)
    res_other = view_detail(req_other, pk=appt_id)
    assert res_other.status_code == 404, "Other patient should receive 404 Not Found"
    print("[PASS] Other patient restricted from accessing appointment")

    # Clean up test appointment
    appt_record.delete()
    other_patient.delete()

    print("\n" + "=" * 60)
    print("ALL TELEHEALTH SYSTEM TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    run_telehealth_tests()
