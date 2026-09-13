'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { MedicineImage } from '@/components/ui/medicine-image';
import { Product, ProductImageStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Search,
  Upload,
  FileSpreadsheet,
  FileArchive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  ArrowRight,
  Layers,
  Sparkles,
  Download,
  Globe,
  FileCheck,
} from 'lucide-react';

export interface CandidateItem {
  id: string;
  product: string;
  product_sku: string;
  catalog_product_name: string;
  catalog_brand_name: string;
  sku: string;
  product_name: string;
  brand: string;
  candidate_image_url: string;
  source_page_url: string;
  source_domain: string;
  source_type: string;
  image_title: string;
  detected_alt_text: string;
  rights_note: string;
  license_url: string;
  matching_confidence: number;
  status: string;
  review_reason: string;
  downloaded_image: any;
  discovered_at: string;
}

interface ImageStats {
  total_products: number;
  verified_images: number;
  missing_images: number;
  pending_review_images: number;
  rejected_images: number;
  broken_images: number;
  duplicate_images: number;
  unmatched_image_filenames: number;
  invalid_files: number;
  products_without_primary_images: number;
}


interface AdminProductItem {
  id: string;
  name: string;
  sku: string;
  slug: string;
  category_name: string;
  brand_name: string;
  dosage_form: string;
  strength?: string;
  pack_size?: string;
  image_url: string;
  image_status: ProductImageStatus;
  image_source: string;
  source_url: string;
  image_license: string;
  image_alt_text: string;
  verified_by: string;
  verified_at: string | null;
  images_count: number;
}

const STATUS_CHOICES: { value: ProductImageStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'MISSING', label: 'Missing' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'BROKEN', label: 'Broken' },
  { value: 'DUPLICATE', label: 'Duplicate' },
];

export default function AdminImageManagementPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'web_discovery' | 'batch_import'>('catalog');
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Web Discovery & Candidate Review State
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('ALL');
  const [candidateStats, setCandidateStats] = useState<{
    total: number;
    discovered: number;
    pending_review: number;
    approved_for_download: number;
    downloaded: number;
    verified: number;
    rejected: number;
    rights_unknown: number;
    product_mismatch: number;
    blocked_source: number;
  } | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isDownloadingApproved, setIsDownloadingApproved] = useState(false);
  const [isExportingDataPackage, setIsExportingDataPackage] = useState(false);
  const [candidateActionLoading, setCandidateActionLoading] = useState<string | null>(null);
  const [candidateActionMessage, setCandidateActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exportPackageResult, setExportPackageResult] = useState<{
    zip_path: string;
    zip_filename: string;
    size_kb: number;
    generated_at: string;
  } | null>(null);

  // Catalog state
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductImageStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Edit modal state
  const [selectedProduct, setSelectedProduct] = useState<AdminProductItem | null>(null);
  const [editStatus, setEditStatus] = useState<ProductImageStatus>('MISSING');
  const [editSource, setEditSource] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editLicense, setEditLicense] = useState('');
  const [editVerifiedBy, setEditVerifiedBy] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Batch import state
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [manifestFile, setManifestFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'PENDING_REVIEW' | 'VERIFIED'>('PENDING_REVIEW');
  const [defaultSource, setDefaultSource] = useState('Authorized Distributor Batch Import');
  const [defaultLicense, setDefaultLicense] = useState('Authorized Pharmaceutical Packaging Asset');
  const [batchVerifiedBy, setBatchVerifiedBy] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Export & Audit state
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);


  // Approve image
  const handleApprove = async (sku: string) => {
    try {
      const res = await apiClient.post('/products/approve-image/', {
        sku,
        verified_by: 'Administrator',
      });
      if (res?.data?.success) {
        setAuditMessage(`SKU ${sku} officially approved and moved to verified/ directory.`);
        await loadProducts();
        await loadStats();
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to approve image.');
    }
  };

  // Reject image
  const handleReject = async (sku: string) => {
    try {
      const res = await apiClient.post('/products/reject-image/', {
        sku,
        rejected_by: 'Administrator',
      });
      if (res?.data?.success) {
        setAuditMessage(`SKU ${sku} rejected and moved to rejected/ directory.`);
        await loadProducts();
        await loadStats();
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to reject image.');
    }
  };

  // Export ZIP
  const handleExportZip = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const res = await apiClient.post('/products/export-zip/');
      if (res?.data?.success) {
        const bytes = res.data.data?.zip_size_bytes || 0;
        setExportMessage(`ZIP successfully generated at ${res.data.data.zip_file} (${Math.round(bytes / 1024)} KB) with 6 report CSVs and README.`);
      }
    } catch (e: any) {
      setExportMessage('Failed to generate ZIP.');
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch Stats
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await apiClient.get('/products/image-stats/');
      if (res?.data?.data) {
        setStats(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load image stats', e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: 15,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await apiClient.get('/products/admin-images/', { params });
      if (res?.data?.data) {
        setProducts(res.data.data.results || []);
        setTotalPages(res.data.data.total_pages || 1);
        setTotalCount(res.data.data.total || 0);
      }
    } catch (e) {
      console.error('Failed to load admin products', e);
    } finally {
      setLoadingProducts(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load candidate list
  const loadCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    try {
      const params: Record<string, any> = {};
      if (candidateSearch.trim()) params.search = candidateSearch.trim();
      if (candidateStatusFilter !== 'ALL') params.status = candidateStatusFilter;

      const res = await apiClient.get('/products/candidates/', { params });
      if (res?.data) {
        const items = res.data.results || res.data.data?.results || res.data.data || res.data || [];
        setCandidates(Array.isArray(items) ? items : []);
      }
    } catch (e) {
      console.error('Failed to load candidates', e);
    } finally {
      setLoadingCandidates(false);
    }
  }, [candidateSearch, candidateStatusFilter]);

  // Load candidate stats
  const loadCandidateStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/products/candidates/stats/');
      if (res?.data?.data) {
        setCandidateStats(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load candidate stats', e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'web_discovery') {
      loadCandidates();
      loadCandidateStats();
    }
  }, [activeTab, loadCandidates, loadCandidateStats]);

  // Trigger web discovery command
  const handleRunDiscovery = async (limit = 15, source = 'all') => {
    setIsDiscovering(true);
    setCandidateActionMessage(null);
    try {
      const res = await apiClient.post('/products/candidates/run-discovery/', { limit, source });
      if (res?.data?.data) {
        setCandidateStats(res.data.data);
      }
      setCandidateActionMessage({
        type: 'success',
        text: `Web discovery query completed successfully. Permitted registries queried without scraping Google Images.`,
      });
      await loadCandidates();
      await loadCandidateStats();
      await loadStats();
    } catch (e: any) {
      setCandidateActionMessage({
        type: 'error',
        text: e?.response?.data?.message || 'Failed to complete web discovery query.',
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  // Trigger automated download for approved candidates
  const handleRunDownloadApproved = async () => {
    setIsDownloadingApproved(true);
    setCandidateActionMessage(null);
    try {
      const res = await apiClient.post('/products/candidates/run-download-approved/', { auto_approve: false });
      if (res?.data?.data) {
        setCandidateStats(res.data.data);
      }
      setCandidateActionMessage({
        type: 'success',
        text: 'Automated download and Pillow verification completed for approved candidates.',
      });
      await loadCandidates();
      await loadCandidateStats();
      await loadProducts();
      await loadStats();
    } catch (e: any) {
      setCandidateActionMessage({
        type: 'error',
        text: e?.response?.data?.message || 'Failed to download approved candidates.',
      });
    } finally {
      setIsDownloadingApproved(false);
    }
  };

  // Trigger export full audit package
  const handleExportDataPackage = async () => {
    setIsExportingDataPackage(true);
    setCandidateActionMessage(null);
    try {
      const res = await apiClient.post('/products/candidates/export-data-package/');
      if (res?.data?.data) {
        setExportPackageResult(res.data.data);
        setCandidateActionMessage({
          type: 'success',
          text: `Full audit data package generated: ${res.data.data.zip_filename} (${res.data.data.size_kb} KB) containing 9 CSV audit reports and package images.`,
        });
      }
    } catch (e: any) {
      setCandidateActionMessage({
        type: 'error',
        text: e?.response?.data?.message || 'Failed to generate export data package.',
      });
    } finally {
      setIsExportingDataPackage(false);
    }
  };

  // Handle single candidate action
  const handleCandidateAction = async (candidateId: string, actionType: string, reason = '') => {
    setCandidateActionLoading(candidateId);
    setCandidateActionMessage(null);
    try {
      const res = await apiClient.post(`/products/candidates/${candidateId}/action/`, {
        action: actionType,
        reason,
        verified_by: 'Administrator',
      });
      if (res?.data?.success) {
        setCandidateActionMessage({
          type: 'success',
          text: res.data.message || `Action executed successfully.`,
        });
        await loadCandidates();
        await loadCandidateStats();
        await loadProducts();
        await loadStats();
      }
    } catch (e: any) {
      setCandidateActionMessage({
        type: 'error',
        text: e?.response?.data?.message || `Failed to execute action.`,
      });
    } finally {
      setCandidateActionLoading(null);
    }
  };


  // Open edit modal
  const openEditModal = (product: AdminProductItem) => {
    setSelectedProduct(product);
    setEditStatus(product.image_status || 'MISSING');
    setEditSource(product.image_source || '');
    setEditSourceUrl(product.source_url || '');
    setEditLicense(product.image_license || '');
    setEditVerifiedBy(product.verified_by || '');
    setEditImageUrl(product.image_url || '');
    setEditImageFile(null);
    setImagePreviewUrl(product.image_url || '');
    setSaveSuccess(null);
    setSaveError(null);
  };

  // Close modal
  const closeEditModal = () => {
    setSelectedProduct(null);
    setEditImageFile(null);
    setImagePreviewUrl('');
    setSaveSuccess(null);
    setSaveError(null);
  };

  // Handle local image file pick
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const objUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objUrl);
    }
  };

  // Submit product image update
  const handleSaveProductImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append('sku', selectedProduct.sku);
      formData.append('image_status', editStatus);
      formData.append('image_source', editSource);
      formData.append('source_url', editSourceUrl);
      formData.append('image_license', editLicense);
      formData.append('verified_by', editVerifiedBy);

      if (editImageFile) {
        formData.append('image_file', editImageFile);
      } else if (editImageUrl) {
        formData.append('image_url', editImageUrl);
      }

      const res = await apiClient.post('/products/update-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data?.success) {
        setSaveSuccess(res.data.message || 'Image updated successfully.');
        await loadProducts();
        await loadStats();
        setTimeout(() => {
          closeEditModal();
        }, 1200);
      } else {
        setSaveError(res?.data?.message || 'Failed to update image.');
      }
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Network error saving product image.');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove image
  const handleRemoveImage = async () => {
    if (!selectedProduct) return;
    if (!confirm(`Are you sure you want to remove image from SKU ${selectedProduct.sku}?`)) return;

    setIsSaving(true);
    try {
      const res = await apiClient.post('/products/update-image/', {
        sku: selectedProduct.sku,
        remove_image: true,
      });
      if (res?.data?.success) {
        setSaveSuccess('Image removed and status set to MISSING.');
        await loadProducts();
        await loadStats();
        setTimeout(() => {
          closeEditModal();
        }, 1000);
      }
    } catch (e: any) {
      setSaveError('Failed to remove image.');
    } finally {
      setIsSaving(false);
    }
  };

  // Run broken images audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditMessage(null);
    try {
      const res = await apiClient.post('/products/audit-broken-images/');
      if (res?.data?.data) {
        setAuditMessage(
          `Audit complete: ${res.data.data.broken_detected} broken image reference(s) flagged.`
        );
        await loadStats();
        await loadProducts();
      }
    } catch (e) {
      setAuditMessage('Audit check failed.');
    } finally {
      setIsAuditing(false);
    }
  };

  // Execute batch import
  const handleExecuteBatchImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      setImportError('Please select a ZIP file containing packaging photographs.');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('zip_file', zipFile);
      if (manifestFile) formData.append('manifest_file', manifestFile);
      formData.append('default_status', importStatus);
      formData.append('default_source', defaultSource);
      formData.append('default_license', defaultLicense);
      formData.append('verified_by', batchVerifiedBy);

      const res = await apiClient.post('/products/batch-import-images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data?.success) {
        setImportResult(res.data.data);
        await loadStats();
        await loadProducts();
      } else {
        setImportError(res?.data?.message || 'Batch import failed.');
      }
    } catch (err: any) {
      setImportError(err?.response?.data?.message || 'Error processing ZIP batch import.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00A896] mb-2 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Operations Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540]">
              Product Image Management & Verification Hub
            </h1>
            <Badge variant="accent" className="hidden sm:inline-flex">
              SKU Workflow
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Audit packaging photographs, manage pharmaceutical image statuses, and batch-import
            authorized image archives matched strictly by exact product SKU.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing...' : 'Run Audit'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportZip}
            disabled={isExporting}
            className="text-xs gap-1.5 bg-[#00A896] hover:bg-[#028090]"
          >
            <FileArchive className={`h-3.5 w-3.5 ${isExporting ? 'animate-spin' : ''}`} />
            <span>{isExporting ? 'Exporting ZIP...' : 'Generate ZIP & Reports'}</span>
          </Button>
        </div>
      </div>

      {auditMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#00A896]" />
            <span>{auditMessage}</span>
          </div>
          <button onClick={() => setAuditMessage(null)} className="text-teal-700 hover:text-teal-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {exportMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileArchive className="h-4 w-4 text-emerald-600" />
            <span>{exportMessage}</span>
          </div>
          <button onClick={() => setExportMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Real-time Metrics Dashboard Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <Card className="p-4 border-slate-200 bg-white">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Products
          </span>
          <div className="text-2xl font-black text-[#0A2540] mt-1">
            {stats?.total_products ?? '...'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Catalog records</span>
        </Card>

        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {stats?.verified_images ?? '...'}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Authentic packshots</span>
        </Card>

        <Card className="p-4 border-amber-200 bg-amber-50/50">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {stats?.pending_review_images ?? '...'}
          </div>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Awaiting audit</span>
        </Card>

        <Card className="p-4 border-slate-200 bg-slate-50/60">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Missing
          </span>
          <div className="text-2xl font-black text-slate-700 mt-1">
            {stats?.missing_images ?? '...'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Using spec placeholder</span>
        </Card>

        <Card className="p-4 border-rose-200 bg-rose-50/50">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Broken
          </span>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {stats?.broken_images ?? 0}
          </div>
          <span className="text-[10px] text-rose-600 mt-0.5 block">Assets missing</span>
        </Card>

        <Card className="p-4 border-indigo-200 bg-indigo-50/50">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block flex items-center gap-1">
            <Layers className="h-3 w-3" /> Duplicate
          </span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {stats?.duplicate_images ?? 0}
          </div>
          <span className="text-[10px] text-indigo-600 mt-0.5 block">Identical hashes</span>
        </Card>
      </div>

      {/* Workflow Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-[#00A896] text-[#00A896]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Catalog Image Verification ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('web_discovery')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'web_discovery'
              ? 'border-[#00A896] text-[#00A896]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Web Discovery & Candidate Review</span>
          {candidateStats?.total ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              {candidateStats.total}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('batch_import')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'batch_import'
              ? 'border-[#00A896] text-[#00A896]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileArchive className="h-4 w-4" />
          <span>Future Batch Import (ZIP / CSV / Excel / JSON)</span>
        </button>
      </div>


      {/* TAB 1: CATALOG VERIFICATION */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by Product Name or exact SKU..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#00A896] focus:border-transparent bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
              >
                {STATUS_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Items Table */}
          {loadingProducts ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-xs">Loading catalog image audit records...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700">No matching products found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search query or status filter.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Preview & Placeholder</th>
                      <th className="py-3.5 px-4">SKU / Item</th>
                      <th className="py-3.5 px-4">Product Details</th>
                      <th className="py-3.5 px-4">Image Status</th>
                      <th className="py-3.5 px-4">Source & License</th>
                      <th className="py-3.5 px-4">Verification Audit</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod) => {
                      const isVer = prod.image_status === 'VERIFIED';
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Preview Column */}
                          <td className="py-3 px-4 w-28">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white">
                              <MedicineImage
                                product={{
                                  ...prod,
                                  primary_image: prod.image_url,
                                }}
                                showBadge={false}
                                className="w-full h-full"
                              />
                            </div>
                          </td>

                          {/* SKU Column */}
                          <td className="py-3 px-4 font-mono font-bold text-[#0A2540] whitespace-nowrap">
                            <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                              {prod.sku}
                            </span>
                          </td>

                          {/* Product Details */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 line-clamp-1">{prod.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {prod.brand_name || 'General'} • {prod.category_name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {prod.dosage_form} {prod.strength ? `• ${prod.strength}` : ''}
                            </div>
                          </td>

                          {/* Image Status Column */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isVer ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="h-3 w-3" />
                                Verified image
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="h-3 w-3" />
                                  Image under review
                                </span>
                                <div className="text-[9px] font-mono text-slate-400">
                                  State: {prod.image_status}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Source & License */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-slate-800 font-medium truncate">
                              {prod.image_source || 'Not provided'}
                            </div>
                            {prod.source_url && (
                              <a
                                href={prod.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#00A896] hover:underline inline-flex items-center gap-0.5 truncate max-w-full"
                              >
                                <span>Source link</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                            <div className="text-[10px] text-slate-400 truncate">
                              {prod.image_license || 'Standard Catalog Asset'}
                            </div>
                          </td>

                          {/* Verification Audit */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                            {prod.verified_by ? (
                              <div>
                                <div className="font-semibold text-slate-900">{prod.verified_by}</div>
                                {prod.verified_at && (
                                  <div className="text-[10px] text-slate-400">
                                    {new Date(prod.verified_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Unverified</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {prod.image_url && prod.image_status !== 'VERIFIED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(prod.sku)}
                                  className="text-[11px] py-1 px-2.5 text-emerald-700 hover:bg-emerald-50 border-emerald-300 gap-1"
                                  title="Approve & move to verified/ folder"
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>Approve</span>
                                </Button>
                              )}

                              {prod.image_url && prod.image_status !== 'REJECTED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(prod.sku)}
                                  className="text-[11px] py-1 px-2 text-rose-700 hover:bg-rose-50 border-rose-300 gap-1"
                                  title="Reject & move to rejected/ folder"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Reject</span>
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(prod)}
                                className="text-xs"
                              >
                                Manage
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {products.length} of {totalCount} products
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="font-bold text-slate-700">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEB PRODUCT IMAGE DISCOVERY & CANDIDATE REVIEW */}
      {activeTab === 'web_discovery' && (

        <div className="space-y-6">
          {/* Header & Controls Card */}
          <Card className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-[#00A896] border border-teal-200">
                    <Globe className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-[#0A2540]">
                      Web Product Image Discovery & Candidate Review
                    </h2>
                    <p className="text-xs text-slate-500">
                      Query authorized public registries (DailyMed, Open Food Facts). Strict dosage matching, rights verification, and automated Pillow validation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={() => handleRunDiscovery(15, 'all')}
                  disabled={isDiscovering}
                  className="bg-[#00A896] hover:bg-[#008f80] text-white text-xs font-bold gap-2 px-4 py-2 rounded-xl shadow-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                  <span>{isDiscovering ? 'Searching Registries...' : 'Run Public Web Discovery'}</span>
                </Button>

                <Button
                  onClick={handleRunDownloadApproved}
                  disabled={isDownloadingApproved}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold gap-2 px-4 py-2 rounded-xl"
                >
                  <Download className={`h-3.5 w-3.5 ${isDownloadingApproved ? 'animate-spin' : ''}`} />
                  <span>{isDownloadingApproved ? 'Downloading...' : 'Download Approved Candidates'}</span>
                </Button>

                <Button
                  onClick={handleExportDataPackage}
                  disabled={isExportingDataPackage}
                  variant="outline"
                  className="border-teal-200 bg-teal-50/50 hover:bg-teal-100/50 text-teal-800 text-xs font-bold gap-2 px-4 py-2 rounded-xl"
                >
                  <FileCheck className={`h-3.5 w-3.5 ${isExportingDataPackage ? 'animate-spin' : ''}`} />
                  <span>{isExportingDataPackage ? 'Generating Package...' : 'Export Audit Package (ZIP)'}</span>
                </Button>
              </div>
            </div>

            {/* Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Candidates</span>
                <div className="text-xl font-black text-slate-800 mt-0.5">{candidateStats?.total ?? candidates.length}</div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Pending Review</span>
                <div className="text-xl font-black text-amber-800 mt-0.5">{candidateStats?.pending_review ?? 0}</div>
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase">Approved Download</span>
                <div className="text-xl font-black text-purple-800 mt-0.5">{candidateStats?.approved_for_download ?? 0}</div>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Downloaded</span>
                <div className="text-xl font-black text-blue-800 mt-0.5">{candidateStats?.downloaded ?? 0}</div>
              </div>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Rights Unknown</span>
                <div className="text-xl font-black text-rose-800 mt-0.5">{candidateStats?.rights_unknown ?? 0}</div>
              </div>

              <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200">
                <span className="text-[10px] font-bold text-orange-700 uppercase">Product Mismatch</span>
                <div className="text-xl font-black text-orange-800 mt-0.5">{candidateStats?.product_mismatch ?? 0}</div>
              </div>
            </div>

            {/* Notification message */}
            {candidateActionMessage && (
              <div
                className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between text-xs font-medium ${
                  candidateActionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {candidateActionMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span>{candidateActionMessage.text}</span>
                </div>
                <button
                  onClick={() => setCandidateActionMessage(null)}
                  className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Export package download ready alert */}
            {exportPackageResult && (
              <div className="mt-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <FileCheck className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-[#0A2540]">Full Audit Package Exported</h4>
                    <p className="text-[11px] text-teal-800 mt-0.5 font-mono">
                      {exportPackageResult.zip_path} ({exportPackageResult.size_kb} KB)
                    </p>
                    <p className="text-[10px] text-teal-700 mt-0.5">
                      Contains 9 regulatory audit CSVs, JSON discovery report, README documentation, and verified/pending image folders.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExportPackageResult(null)}
                  className="self-end sm:self-center text-xs font-bold text-teal-700 hover:underline px-3 py-1 bg-white rounded-lg border border-teal-200"
                >
                  Dismiss
                </button>
              </div>
            )}
          </Card>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search candidates by SKU, drug name, or registry domain..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#00A896] focus:border-transparent bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Candidate Status:</span>
              <select
                value={candidateStatusFilter}
                onChange={(e) => setCandidateStatusFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED_FOR_DOWNLOAD">Approved for Download</option>
                <option value="DOWNLOADED">Downloaded</option>
                <option value="DISCOVERED">Discovered</option>
                <option value="RIGHTS_UNKNOWN">Rights Unknown</option>
                <option value="PRODUCT_MISMATCH">Product Mismatch</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="BLOCKED_SOURCE">Blocked Source</option>
              </select>
            </div>
          </div>

          {/* Candidate Items Cards */}
          {loadingCandidates ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-xs">Loading discovered image candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
              <Globe className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700">No image candidates found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No image candidates match your current filter. Click &quot;Run Public Web Discovery&quot; above to search authorized public registries.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((cand) => {
                const confPercent = Math.round(cand.matching_confidence * 100);
                const hasRightsWarning =
                  cand.status === 'RIGHTS_UNKNOWN' ||
                  cand.rights_note?.toLowerCase().includes('permission has not been confirmed');
                const isMismatch = cand.status === 'PRODUCT_MISMATCH';

                return (
                  <Card
                    key={cand.id}
                    className={`p-5 rounded-3xl bg-white border transition-shadow hover:shadow-md flex flex-col justify-between ${
                      hasRightsWarning
                        ? 'border-amber-200 bg-amber-50/20'
                        : isMismatch
                        ? 'border-orange-200 bg-orange-50/20'
                        : cand.status === 'DOWNLOADED'
                        ? 'border-blue-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top: SKU & Confidence Score */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <span className="font-mono font-bold text-xs text-[#0A2540]">
                            {cand.sku || cand.product_sku}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            {cand.brand || cand.catalog_brand_name || 'Generic'}
                          </span>
                        </div>

                        {/* Matching Confidence Badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500">Match:</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              confPercent >= 70
                                ? 'bg-emerald-100 text-emerald-800'
                                : confPercent >= 40
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {confPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Middle: Candidate Image Preview & Product Info */}
                      <div className="flex gap-4 py-3.5">
                        {/* Candidate Image Preview */}
                        <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cand.candidate_image_url}
                            alt={cand.detected_alt_text || cand.image_title || cand.product_name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Product & Registry Details */}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-800 line-clamp-2">
                            {cand.catalog_product_name || cand.product_name}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                            Discovered: <span className="font-medium text-slate-700">{cand.image_title || cand.detected_alt_text || 'Package Front Photo'}</span>
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {cand.source_domain}
                            </span>
                            {cand.source_page_url && (
                              <a
                                href={cand.source_page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-[#00A896] hover:underline flex items-center gap-1"
                              >
                                <span>Source page</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rights & Compliance Notice */}
                      {hasRightsWarning ? (
                        <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10.5px] text-amber-900 flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Usage permission has not been confirmed.</span>
                            <span className="text-[9.5px] text-amber-700">
                              {cand.review_reason || 'Requires manual verification of commercial reuse rights before approval.'}
                            </span>
                          </div>
                        </div>
                      ) : isMismatch ? (
                        <div className="mb-3 p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-[10.5px] text-orange-900 flex items-start gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Product Attribute Mismatch</span>
                            <span className="text-[9.5px] text-orange-700">
                              {cand.review_reason || 'Strength, dosage form, or packaging differs from catalog record.'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-600">
                          <span className="font-semibold text-slate-700">License / Rights: </span>
                          <span>{cand.rights_note || 'Authorized Registry Public Domain / CC'}</span>
                        </div>
                      )}

                      {/* Current Status Badge */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-semibold text-slate-400">Candidate Status:</span>
                        <span
                          className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            cand.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : cand.status === 'APPROVED_FOR_DOWNLOAD'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : cand.status === 'DOWNLOADED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : cand.status === 'PENDING_REVIEW'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : cand.status === 'RIGHTS_UNKNOWN'
                              ? 'bg-amber-50 text-amber-800 border border-amber-400'
                              : cand.status === 'PRODUCT_MISMATCH'
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : cand.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {cand.status}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Approve For Download Button */}
                        {cand.status !== 'APPROVED_FOR_DOWNLOAD' && cand.status !== 'DOWNLOADED' && cand.status !== 'VERIFIED' && (
                          <Button
                            size="sm"
                            disabled={candidateActionLoading === cand.id}
                            onClick={() => handleCandidateAction(cand.id, 'approve_for_download')}
                            className="text-[11px] h-7 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-2.5 font-bold gap-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>Approve for download</span>
                          </Button>
                        )}

                        {/* Download & Verify Button */}
                        {cand.status !== 'VERIFIED' && (
                          <Button
                            size="sm"
                            disabled={candidateActionLoading === cand.id}
                            onClick={() => handleCandidateAction(cand.id, 'mark_verified')}
                            className="text-[11px] h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 font-bold gap-1"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            <span>Mark verified</span>
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Rights Unknown */}
                        {cand.status !== 'RIGHTS_UNKNOWN' && (
                          <button
                            title="Flag as Rights Unknown"
                            disabled={candidateActionLoading === cand.id}
                            onClick={() => handleCandidateAction(cand.id, 'mark_rights_unknown')}
                            className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 text-xs font-semibold"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Mismatch */}
                        {cand.status !== 'PRODUCT_MISMATCH' && (
                          <button
                            title="Flag Product Mismatch"
                            disabled={candidateActionLoading === cand.id}
                            onClick={() => handleCandidateAction(cand.id, 'mark_mismatch')}
                            className="p-1.5 rounded-lg text-orange-700 hover:bg-orange-100 text-xs font-semibold"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Reject */}
                        {cand.status !== 'REJECTED' && (
                          <button
                            title="Reject Candidate"
                            disabled={candidateActionLoading === cand.id}
                            onClick={() => handleCandidateAction(cand.id, 'reject')}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 text-xs font-semibold"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FUTURE BATCH IMPORT (ZIP / CSV / Excel / JSON) */}
      {activeTab === 'batch_import' && (

        <div className="max-w-4xl space-y-6">
          <Card className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#0A2540]">
                Batch Packaging Photos Import (SKU Exact Match)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload a ZIP archive containing high-resolution packaging photos. MediSwift will
                automatically link each file strictly by exact SKU (e.g.{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#00A896] font-bold">
                  MS-0001.jpg
                </code>{' '}
                → SKU <code className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">MS-0001</code>
                ).
              </p>
            </div>

            {/* Strict Rules Callout */}
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span>Strict Compliance & Safety Rules</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-800/90 text-[11px]">
                <li>
                  <strong>Exact SKU Matching Only:</strong> Images will only be linked if the filename stem
                  matches the SKU exactly. No fuzzy matching by medicine name will ever occur.
                </li>
                <li>
                  <strong>Storage Isolation:</strong> Packshot assets are stored in{' '}
                  <code className="font-mono bg-amber-100/80 px-1 rounded">media/products/packshots/</code>
                  , completely separated from private patient prescription uploads.
                </li>
                <li>
                  <strong>Supported Formats:</strong> JPG, PNG, WebP, AVIF. Manifest support: CSV,
                  Excel (.xlsx, .xls), JSON.
                </li>
              </ul>
            </div>

            <form onSubmit={handleExecuteBatchImport} className="space-y-6">
              {/* ZIP Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Packaging Photographs ZIP Archive *
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-[#00A896] rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
                  <FileArchive className="h-8 w-8 text-[#00A896] mx-auto mb-2" />
                  <div className="text-xs font-semibold text-slate-700">
                    {zipFile ? zipFile.name : 'Select or drag & drop ZIP file containing packshots'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Filename example: MS-0001.jpg, MS-0002.png, MS-0003.webp
                  </p>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    className="mt-3 text-xs block mx-auto file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#00A896] file:text-white hover:file:bg-[#028090] cursor-pointer"
                  />
                </div>
              </div>

              {/* Manifest Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Optional Manifest File (CSV, Excel .xlsx/.xls, or JSON)
                </label>
                <div className="border border-slate-200 rounded-2xl p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {manifestFile ? manifestFile.name : 'Metadata Manifest (Optional)'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Map individual SKUs to source, license, and verification status
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={(e) => setManifestFile(e.target.files?.[0] || null)}
                    className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Batch Defaults */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Verification Status
                  </label>
                  <select
                    value={importStatus}
                    onChange={(e) => setImportStatus(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                  >
                    <option value="PENDING_REVIEW">PENDING_REVIEW (Recommended — Image under review)</option>
                    <option value="VERIFIED">VERIFIED (Mark as Authorized Packaging Photo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Verified By / Quality Officer
                  </label>
                  <input
                    type="text"
                    value={batchVerifiedBy}
                    onChange={(e) => setBatchVerifiedBy(e.target.value)}
                    placeholder="e.g. MediSwift QA Team / Authorized Auditor"
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default Source Name
                  </label>
                  <input
                    type="text"
                    value={defaultSource}
                    onChange={(e) => setDefaultSource(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default License Note
                  </label>
                  <input
                    type="text"
                    value={defaultLicense}
                    onChange={(e) => setDefaultLicense(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                  />
                </div>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isImporting || !zipFile}
                className="w-full py-3 text-xs sm:text-sm font-bold gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Extracting, Verifying & Matching SKUs...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Execute Batch Import by Exact SKU</span>
                  </>
                )}
              </Button>
            </form>

            {/* Import Results Box */}
            {importResult && (
              <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Batch Import Execution Finished</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-600">Matched SKUs</span>
                    <div className="text-xl font-black text-emerald-800">
                      {importResult.matched_count}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-600">Unmatched</span>
                    <div className="text-xl font-black text-amber-800">
                      {importResult.unmatched_count}
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                    <span className="text-[10px] uppercase font-bold text-rose-600">Invalid Files</span>
                    <div className="text-xl font-black text-rose-800">
                      {importResult.invalid_count}
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <span className="text-[10px] uppercase font-bold text-indigo-600">Duplicates</span>
                    <div className="text-xl font-black text-indigo-800">
                      {importResult.duplicates_count}
                    </div>
                  </div>
                </div>

                {importResult.unmatched && importResult.unmatched.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 max-h-36 overflow-y-auto">
                    <span className="font-bold text-slate-800 block">
                      Unmatched Files (No matching SKU found):
                    </span>
                    {importResult.unmatched.map((fn: string) => (
                      <div key={fn} className="font-mono text-[10px]">
                        • {fn}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* EDIT MODAL FOR SINGLE PRODUCT */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-teal-50 text-[#00A896] border border-teal-200">
                  SKU: {selectedProduct.sku}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#0A2540] mt-1 line-clamp-1">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductImage} className="p-6 space-y-5">
              {/* Preview Box */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 bg-white shrink-0">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl.startsWith('/media/') ? `http://localhost:8000${imagePreviewUrl}` : imagePreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain p-2"
                      onError={() => setImagePreviewUrl('')}
                    />
                  ) : (
                    <MedicineImage
                      product={{
                        ...selectedProduct,
                        image_status: editStatus,
                        image_url: '',
                      }}
                      className="w-full h-full"
                    />
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900">Active Visual State</div>
                  <p className="text-[11px] text-slate-500">
                    {editStatus === 'VERIFIED'
                      ? 'Displaying authentic verified packaging photograph with Verified image badge.'
                      : 'Displaying MediSwift custom verification placeholder with "Product image under verification".'}
                  </p>
                  {selectedProduct.image_url && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold pt-1 underline"
                    >
                      Delete Active Image & Reset to Missing
                    </button>
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verification Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProductImageStatus)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                >
                  <option value="MISSING">MISSING (No packaging image provided)</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW (Awaiting pharmacist inspection)</option>
                  <option value="VERIFIED">VERIFIED (Authenticated Packaging Photograph)</option>
                  <option value="REJECTED">REJECTED (Poor quality / Incorrect product)</option>
                  <option value="BROKEN">BROKEN (Unreachable asset URL)</option>
                  <option value="DUPLICATE">DUPLICATE (Redundant / duplicate image)</option>
                </select>
              </div>

              {/* Upload New Image File */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Packaging Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Saved automatically to media/products/packshots/{selectedProduct.sku}.ext
                </span>
              </div>

              {/* OR Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Or External Image URL
                </label>
                <input
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => {
                    setEditImageUrl(e.target.value);
                    setImagePreviewUrl(e.target.value);
                  }}
                  placeholder="https://authorized-distributor.com/packshots/..."
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                />
              </div>

              {/* Source & License Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Source Name
                  </label>
                  <input
                    type="text"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    placeholder="e.g. Cipla Official Portal"
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Source URL
                  </label>
                  <input
                    type="url"
                    value={editSourceUrl}
                    onChange={(e) => setEditSourceUrl(e.target.value)}
                    placeholder="https://brand.com/products/..."
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    License / Authorization Note
                  </label>
                  <input
                    type="text"
                    value={editLicense}
                    onChange={(e) => setEditLicense(e.target.value)}
                    placeholder="e.g. Authorized Distributor License #4891"
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Verified By
                  </label>
                  <input
                    type="text"
                    value={editVerifiedBy}
                    onChange={(e) => setEditVerifiedBy(e.target.value)}
                    placeholder="Pharmacist or QA Officer Name"
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A896]"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={closeEditModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} size="sm" className="gap-1.5">
                  {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save Configuration</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
