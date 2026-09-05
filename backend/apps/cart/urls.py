from django.urls import path
from apps.cart.views import CartView, CartItemView, CartItemDetailView

urlpatterns = [
    path('', CartView.as_view(), name='cart-detail'),
    path('items/', CartItemView.as_view(), name='cart-items'),
    path('items/<uuid:item_id>/', CartItemDetailView.as_view(), name='cart-item-detail'),
]
