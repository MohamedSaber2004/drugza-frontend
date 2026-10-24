<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Package,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  XCircle,
  Search,
  SlidersHorizontal
} from 'lucide-vue-next';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import PriceDisplay from '@/components/ui/PriceDisplay.vue';
import Pagination from '@/components/ui/Pagination.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import { ordersService, getOrderStatusMeta, invoicesService } from '@/services';
import { type Order, OrderStatus } from '@/types';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { t, locale } = useI18n();

const activeTab = ref<'history' | 'invoices'>('history');
const orders = ref<Order[]>([]);
const isLoading = ref(true);
const currentPage = ref(1);
const pageSize = 10;
const expandedOrderIds = ref<Set<string>>(new Set());

function toggleOrderItems(orderId: string) {
  if (expandedOrderIds.value.has(orderId)) {
    expandedOrderIds.value.delete(orderId);
  } else {
    expandedOrderIds.value.add(orderId);
  }
}

// Order History Filtering
type OrderFilterType = 'all' | 'in_progress' | 'completed' | 'refunded' | 'cancelled';
const selectedStatusFilter = ref<OrderFilterType>('all');
const historySearchQuery = ref('');

function matchesStatusFilter(ord: Order, filter: OrderFilterType): boolean {
  const code = typeof ord.statusCode === 'number' ? ord.statusCode : 0;
  switch (filter) {
    case 'in_progress':
      return [
        OrderStatus.Pending,
        OrderStatus.Approved,
        OrderStatus.Prepared,
        OrderStatus.Shipped,
        OrderStatus.ReAssignTo
      ].includes(code);
    case 'completed':
      return [
        OrderStatus.Delivered,
        OrderStatus.Completed
      ].includes(code);
    case 'refunded':
      return [
        OrderStatus.Refund,
        OrderStatus.PartiallyRefunded
      ].includes(code);
    case 'cancelled':
      return [
        OrderStatus.Cancel,
        OrderStatus.Rejected
      ].includes(code);
    case 'all':
    default:
      return true;
  }
}

const statusCounts = computed(() => {
  let inProgress = 0;
  let completed = 0;
  let refunded = 0;
  let cancelled = 0;

  for (const ord of orders.value) {
    const code = typeof ord.statusCode === 'number' ? ord.statusCode : 0;
    if ([OrderStatus.Pending, OrderStatus.Approved, OrderStatus.Prepared, OrderStatus.Shipped, OrderStatus.ReAssignTo].includes(code)) {
      inProgress++;
    } else if ([OrderStatus.Delivered, OrderStatus.Completed].includes(code)) {
      completed++;
    } else if ([OrderStatus.Refund, OrderStatus.PartiallyRefunded].includes(code)) {
      refunded++;
    } else if ([OrderStatus.Cancel, OrderStatus.Rejected].includes(code)) {
      cancelled++;
    }
  }

  return {
    all: orders.value.length,
    in_progress: inProgress,
    completed,
    refunded,
    cancelled
  };
});

const filteredOrders = computed(() => {
  return orders.value.filter(ord => {
    // 1. Status Filter
    if (!matchesStatusFilter(ord, selectedStatusFilter.value)) {
      return false;
    }
    // 2. Search Query Filter
    if (historySearchQuery.value.trim()) {
      const q = historySearchQuery.value.toLowerCase().trim();
      const matchNum = ord.orderNumber.toLowerCase().includes(q) || ord.id.toLowerCase().includes(q);
      const matchSup = ord.supplierName.toLowerCase().includes(q);
      const matchItem = ord.items.some(i => i.productName.toLowerCase().includes(q));
      if (!matchNum && !matchSup && !matchItem) return false;
    }
    return true;
  });
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredOrders.value.slice(start, start + pageSize);
});

watch([selectedStatusFilter, historySearchQuery], () => {
  currentPage.value = 1;
});

onMounted(async () => {
  isLoading.value = true;
  try {
    const list = await ordersService.getAllMyOrders();
    orders.value = list;
    if (route.query.placedOrder) {
      const match = list.find(o => o.id === route.query.placedOrder || o.orderNumber === route.query.placedOrder);
      if (match) {
        expandedOrderIds.value.add(match.id);
      }
    }
  } catch (e) {
    console.warn('Error loading orders:', e);
  } finally {
    isLoading.value = false;
  }
});

async function downloadInvoice(invId: string) {
  if (!invId) return;
  const rawNum = invId.replace(/^INV-/, '');
  try {
    await invoicesService.generateInvoice(rawNum);
    toast.success(
      locale.value === 'ar'
        ? `تم طلب وتوليد الفاتورة الضريبية للطلبية #${rawNum}.`
        : `Tax invoice requested for order #${rawNum}.`
    );
  } catch {
    toast.info(
      locale.value === 'ar'
        ? `الفاتورة الضريبية للطلبية #${rawNum} قيد الإصدار والمعالجة.`
        : `Tax invoice for order #${rawNum} is being prepared.`
    );
  }
}
</script>

<template>
  <div class="orders-page">
    <div class="drugza-container orders-container">
      <div class="orders-header">
        <div>
          <span class="orders-eyebrow">{{ t('ordersPage.eyebrow') }}</span>
          <h1 class="orders-title">{{ t('ordersPage.heading') }}</h1>
          <p class="orders-sub">{{ t('ordersPage.subtitle') }}</p>
        </div>

        <!-- Navigation Tabs -->
        <div class="orders-nav-tabs">
          <button
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'history' }"
            @click="activeTab = 'history'"
          >
            {{ locale === 'ar' ? 'سجل الطلبيات' : 'Order History' }}
          </button>
          <button
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'invoices' }"
            @click="activeTab = 'invoices'"
          >
            {{ locale === 'ar' ? 'الفواتير الضريبية' : 'Tax Invoices' }}
          </button>
        </div>
      </div>

      <!-- Tab 1: Order History -->
      <div v-if="activeTab === 'history'" class="history-view">
        <!-- Order History Filter Controls -->
        <div class="history-filter-card">
          <!-- Status Filter Tabs / Pills -->
          <div class="status-filters-pills" role="tablist">
            <button
              type="button"
              class="status-pill"
              :class="{ 'is-active': selectedStatusFilter === 'all' }"
              @click="selectedStatusFilter = 'all'"
            >
              <Package :size="15" />
              <span>{{ locale === 'ar' ? 'جميع الطلبات' : 'All Orders' }}</span>
              <span class="count-tag">{{ statusCounts.all }}</span>
            </button>

            <button
              type="button"
              class="status-pill in-progress-pill"
              :class="{ 'is-active': selectedStatusFilter === 'in_progress' }"
              @click="selectedStatusFilter = 'in_progress'"
            >
              <Clock :size="15" />
              <span>{{ locale === 'ar' ? 'قيد التنفيذ' : 'In-Progress' }}</span>
              <span class="count-tag" v-if="statusCounts.in_progress > 0">{{ statusCounts.in_progress }}</span>
            </button>

            <button
              type="button"
              class="status-pill completed-pill"
              :class="{ 'is-active': selectedStatusFilter === 'completed' }"
              @click="selectedStatusFilter = 'completed'"
            >
              <CheckCircle2 :size="15" />
              <span>{{ locale === 'ar' ? 'المكتملة' : 'Completed' }}</span>
              <span class="count-tag" v-if="statusCounts.completed > 0">{{ statusCounts.completed }}</span>
            </button>

            <button
              type="button"
              class="status-pill refunded-pill"
              :class="{ 'is-active': selectedStatusFilter === 'refunded' }"
              @click="selectedStatusFilter = 'refunded'"
            >
              <RotateCcw :size="15" />
              <span>{{ locale === 'ar' ? 'المرتجعة' : 'Returned' }}</span>
              <span class="count-tag" v-if="statusCounts.refunded > 0">{{ statusCounts.refunded }}</span>
            </button>

            <button
              type="button"
              class="status-pill cancelled-pill"
              :class="{ 'is-active': selectedStatusFilter === 'cancelled' }"
              @click="selectedStatusFilter = 'cancelled'"
            >
              <XCircle :size="15" />
              <span>{{ locale === 'ar' ? 'الملغية والمرفوضة' : 'Cancelled / Rejected' }}</span>
              <span class="count-tag" v-if="statusCounts.cancelled > 0">{{ statusCounts.cancelled }}</span>
            </button>
          </div>

          <!-- Quick Search Field -->
          <div class="history-search-wrapper">
            <Search :size="15" class="search-icon" />
            <input
              v-model="historySearchQuery"
              type="text"
              class="history-search-input"
              :placeholder="locale === 'ar' ? 'بحث برقم الطلبية، المستودع، أو الصنف...' : 'Search by order #, warehouse, or item...'"
            />
            <button
              v-if="historySearchQuery"
              type="button"
              class="clear-search-btn"
              title="Clear search"
              @click="historySearchQuery = ''"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Desktop/Laptop Table View (>= 768px) -->
        <div class="table-card desktop-only-table" v-loading="isLoading">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ locale === 'ar' ? 'رقم الطلبية' : 'Order #' }}</th>
                <th>{{ locale === 'ar' ? 'تاريخ الطلبية' : 'Order Date' }}</th>
                <th>{{ locale === 'ar' ? 'مستودع الموزع' : 'Supplier Warehouse' }}</th>
                <th>{{ locale === 'ar' ? 'عدد الأصناف' : 'Items Count' }}</th>
                <th>{{ locale === 'ar' ? 'الإجمالي' : 'Total Amount' }}</th>
                <th>{{ locale === 'ar' ? 'حالة الشحن' : 'Delivery Status' }}</th>
                <th>{{ locale === 'ar' ? 'إجراء' : 'Actions' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="7" style="padding: 1.5rem 1rem;">
                  <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div v-for="i in 5" :key="'ord-skel-' + i" style="display: flex; gap: 16px; align-items: center; justify-content: space-between;">
                      <Skeleton width="120px" height="24px" radius="6px" />
                      <Skeleton width="100px" height="24px" radius="6px" />
                      <Skeleton width="160px" height="24px" radius="6px" />
                      <Skeleton width="60px" height="24px" radius="6px" />
                      <Skeleton width="90px" height="24px" radius="6px" />
                      <Skeleton width="110px" height="28px" rounded />
                      <Skeleton width="80px" height="34px" radius="8px" />
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredOrders.length === 0">
                <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                  <div class="empty-filter-state">
                    <Package :size="30" class="empty-icon" />
                    <p class="empty-text">
                      {{ historySearchQuery
                          ? (locale === 'ar' ? 'لا توجد طلبات تطابق كلمة البحث.' : 'No orders match your search query.')
                          : (locale === 'ar' ? 'لا توجد طلبات في هذا القسم حالياً.' : 'No orders found in this section.') }}
                    </p>
                    <Button
                      v-if="selectedStatusFilter !== 'all' || historySearchQuery"
                      variant="outline"
                      size="sm"
                      @click="selectedStatusFilter = 'all'; historySearchQuery = ''"
                    >
                      {{ locale === 'ar' ? 'عرض جميع الطلبات' : 'Show All Orders' }}
                    </Button>
                  </div>
                </td>
              </tr>
              <template v-for="ord in paginatedOrders" :key="ord.id">
                <tr>
                  <td>
                    <strong>{{ ord.orderNumber }}</strong>
                  </td>
                  <td>{{ new Date(ord.createdAt).toLocaleDateString() }}</td>
                  <td>{{ ord.supplierName }}</td>
                  <td>{{ ord.items.reduce((s, i) => s + i.quantity, 0) }} {{ locale === 'ar' ? 'وحدة' : 'units' }}</td>
                  <td>
                    <PriceDisplay :price="ord.total" size="sm" />
                  </td>
                  <td>
                    <Badge
                      :variant="getOrderStatusMeta(ord.statusCode ?? ord.status, locale).variant"
                    >
                      {{ getOrderStatusMeta(ord.statusCode ?? ord.status, locale).label }}
                    </Badge>
                  </td>
                  <td>
                    <div class="table-actions-cell">
                      <button
                        type="button"
                        class="toggle-items-action-btn"
                        :class="{ 'is-open': expandedOrderIds.has(ord.id) }"
                        :title="expandedOrderIds.has(ord.id) ? t('ordersPage.hideItems') : t('ordersPage.viewItems')"
                        @click="toggleOrderItems(ord.id)"
                      >
                        <Package :size="14" />
                        <span>{{ ord.items.length }}</span>
                        <ChevronDown :size="13" class="chevron-ico" />
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        @click="downloadInvoice('INV-' + ord.id)"
                      >
                        <FileText :size="13" />
                        <span>{{ locale === 'ar' ? 'فاتورة' : 'Invoice' }}</span>
                      </Button>
                    </div>
                  </td>
                </tr>

                <!-- Expandable Items Sub-table -->
                <tr v-if="expandedOrderIds.has(ord.id)" class="expanded-items-tr">
                  <td colspan="7" class="expanded-items-td">
                    <div class="expanded-items-container">
                      <div class="expanded-items-header">
                        <div class="expanded-title-box">
                          <Package :size="15" />
                          <strong>{{ t('ordersPage.itemsTitle') }}</strong>
                          <span class="items-count-badge">({{ ord.items.length }})</span>
                        </div>
                        <span class="order-ref-hint">{{ ord.orderNumber }}</span>
                      </div>

                      <div class="sub-items-table-wrapper">
                        <table class="sub-items-table">
                          <thead>
                            <tr>
                              <th>{{ locale === 'ar' ? 'اسم الدواء / الصنف' : 'Medicine / Product' }}</th>
                              <th>{{ locale === 'ar' ? 'المستودع' : 'Warehouse' }}</th>
                              <th>{{ locale === 'ar' ? 'الكمية' : 'Quantity' }}</th>
                              <th>{{ locale === 'ar' ? 'سعر الوحدة' : 'Unit Price' }}</th>
                              <th>{{ locale === 'ar' ? 'الإجمالي' : 'Total' }}</th>
                              <th>{{ t('ordersPage.itemStatus') }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="item in ord.items" :key="item.id">
                              <td>
                                <span class="sub-item-name">{{ item.productName }}</span>
                              </td>
                              <td>
                                <span class="sub-item-wh">{{ item.inventoryName || ord.supplierName }}</span>
                              </td>
                              <td>{{ item.quantity }}</td>
                              <td>{{ item.unitPrice ? item.unitPrice.toFixed(2) + ' ج.م' : '-' }}</td>
                              <td><strong>{{ (item.totalPrice || item.quantity * item.unitPrice).toFixed(2) }} ج.م</strong></td>
                              <td>
                                <Badge :variant="getOrderStatusMeta(item.statusCode ?? item.status, locale).variant">
                                  {{ getOrderStatusMeta(item.statusCode ?? item.status, locale).label }}
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Mobile Orders Cards (< 768px) -->
        <div class="mobile-orders-list mobile-only-cards" v-loading="isLoading">
          <div v-if="isLoading" style="display: flex; flex-direction: column; gap: 14px;">
            <div
              v-for="i in 3"
              :key="'mob-skel-' + i"
              style="background: #ffffff; border: 1px solid #e5eaf0; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 2px 8px rgba(18, 73, 107, 0.03);"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <Skeleton width="130px" height="20px" radius="6px" />
                <Skeleton width="80px" height="24px" rounded />
              </div>
              <Skeleton width="160px" height="16px" radius="4px" />
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                <Skeleton width="100px" height="20px" radius="6px" />
                <Skeleton width="80px" height="34px" radius="8px" />
              </div>
            </div>
          </div>

          <div v-else-if="filteredOrders.length === 0" class="empty-mobile-card empty-filter-state">
            <Package :size="28" class="empty-icon" />
            <p class="empty-text">
              {{ historySearchQuery
                  ? (locale === 'ar' ? 'لا توجد طلبات تطابق كلمة البحث.' : 'No orders match your search query.')
                  : (locale === 'ar' ? 'لا توجد طلبات في هذا القسم حالياً.' : 'No orders found in this section.') }}
            </p>
            <Button
              v-if="selectedStatusFilter !== 'all' || historySearchQuery"
              variant="outline"
              size="sm"
              @click="selectedStatusFilter = 'all'; historySearchQuery = ''"
            >
              {{ locale === 'ar' ? 'عرض جميع الطلبات' : 'Show All Orders' }}
            </Button>
          </div>
          <div
            v-for="ord in paginatedOrders"
            :key="'mob-' + ord.id"
            class="mobile-order-card"
          >
            <div class="mob-card-head">
              <div class="mob-order-num">
                <Package :size="16" class="mob-ico" />
                <strong>{{ ord.orderNumber }}</strong>
              </div>
              <Badge :variant="getOrderStatusMeta(ord.statusCode ?? ord.status, locale).variant">
                {{ getOrderStatusMeta(ord.statusCode ?? ord.status, locale).label }}
              </Badge>
            </div>
            <div class="mob-card-body">
              <div class="mob-row">
                <span class="mob-label">{{ locale === 'ar' ? 'المستودع:' : 'Warehouse:' }}</span>
                <span class="mob-val">{{ ord.supplierName }}</span>
              </div>
              <div class="mob-row">
                <span class="mob-label">{{ locale === 'ar' ? 'تاريخ الطلبية:' : 'Date:' }}</span>
                <span class="mob-val">{{ new Date(ord.createdAt).toLocaleDateString() }}</span>
              </div>
              <div class="mob-row">
                <span class="mob-label">{{ locale === 'ar' ? 'الأصناف:' : 'Items:' }}</span>
                <button
                  type="button"
                  class="mob-toggle-items-btn"
                  @click="toggleOrderItems(ord.id)"
                >
                  <span>{{ ord.items.reduce((s, i) => s + i.quantity, 0) }} {{ locale === 'ar' ? 'وحدة' : 'units' }}</span>
                  <span class="mob-items-hint">({{ expandedOrderIds.has(ord.id) ? t('ordersPage.hideItems') : t('ordersPage.viewItems') }})</span>
                </button>
              </div>

              <!-- Mobile expanded items list with individual item statuses -->
              <div v-if="expandedOrderIds.has(ord.id)" class="mob-expanded-items">
                <div v-for="item in ord.items" :key="item.id" class="mob-sub-item">
                  <div class="mob-sub-item-top">
                    <span class="mob-item-name">{{ item.productName }}</span>
                    <Badge size="sm" :variant="getOrderStatusMeta(item.statusCode ?? item.status, locale).variant">
                      {{ getOrderStatusMeta(item.statusCode ?? item.status, locale).label }}
                    </Badge>
                  </div>
                  <div class="mob-sub-item-bottom">
                    <span class="mob-item-wh">{{ item.inventoryName || ord.supplierName }}</span>
                    <span class="mob-item-math">{{ item.quantity }} × {{ item.unitPrice ? item.unitPrice.toFixed(2) : '-' }} ج.م</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="mob-card-foot">
              <PriceDisplay :price="ord.total" size="md" />
              <Button
                variant="outline"
                size="sm"
                @click="downloadInvoice('INV-' + ord.id)"
              >
                <FileText :size="14" />
                <span>{{ locale === 'ar' ? 'الفاتورة الضريبية' : 'Tax Invoice' }}</span>
              </Button>
            </div>
          </div>
        </div>

        <Pagination
          v-if="filteredOrders.length > pageSize"
          v-model="currentPage"
          :total-items="filteredOrders.length"
          :page-size="pageSize"
        />
      </div>

      <!-- Tab 3: Invoices -->
      <div v-else class="invoices-view">
        <!-- Desktop/Laptop Table View (>= 768px) -->
        <div class="table-card desktop-only-table">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ locale === 'ar' ? 'رقم الفاتورة' : 'Invoice #' }}</th>
                <th>{{ locale === 'ar' ? 'رقم الطلبية' : 'Order #' }}</th>
                <th>{{ locale === 'ar' ? 'تاريخ الإصدار' : 'Issue Date' }}</th>
                <th>{{ locale === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount' }}</th>
                <th>{{ locale === 'ar' ? 'حالة السداد' : 'Payment Status' }}</th>
                <th>{{ locale === 'ar' ? 'تحميل' : 'Download' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="orders.length === 0">
                <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                  {{ locale === 'ar' ? 'لا توجد فواتير صادرة حالياً.' : 'No invoices generated yet.' }}
                </td>
              </tr>
              <tr v-for="ord in paginatedOrders" :key="'inv-' + ord.id">
                <td><strong>INV-{{ ord.id }}</strong></td>
                <td>{{ ord.orderNumber }}</td>
                <td>{{ new Date(ord.createdAt).toLocaleDateString() }}</td>
                <td><PriceDisplay :price="ord.total" size="sm" /></td>
                <td><Badge variant="success">{{ locale === 'ar' ? 'مدفوعة' : 'Paid' }}</Badge></td>
                <td>
                  <Button variant="ghost" size="sm" @click="downloadInvoice('INV-' + ord.id)">
                    <Download :size="15" />
                    <span>PDF</span>
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Invoices Cards (< 768px) -->
        <div class="mobile-invoices-list mobile-only-cards">
          <div v-if="orders.length === 0" class="empty-mobile-card">
            {{ locale === 'ar' ? 'لا توجد فواتير صادرة حالياً.' : 'No invoices generated yet.' }}
          </div>
          <div
            v-for="ord in paginatedOrders"
            :key="'mob-inv-' + ord.id"
            class="mobile-invoice-card"
          >
            <div class="mob-card-head">
              <div class="mob-order-num">
                <FileText :size="16" class="mob-ico" />
                <strong>INV-{{ ord.id }}</strong>
              </div>
              <Badge variant="success">{{ locale === 'ar' ? 'مدفوعة' : 'Paid' }}</Badge>
            </div>
            <div class="mob-card-body">
              <div class="mob-row">
                <span class="mob-label">{{ locale === 'ar' ? 'رقم الطلبية:' : 'Order #:' }}</span>
                <span class="mob-val">{{ ord.orderNumber }}</span>
              </div>
              <div class="mob-row">
                <span class="mob-label">{{ locale === 'ar' ? 'تاريخ الإصدار:' : 'Issue Date:' }}</span>
                <span class="mob-val">{{ new Date(ord.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
            <div class="mob-card-foot">
              <PriceDisplay :price="ord.total" size="md" />
              <Button variant="outline" size="sm" @click="downloadInvoice('INV-' + ord.id)">
                <Download :size="15" />
                <span>PDF</span>
              </Button>
            </div>
          </div>
        </div>

        <Pagination
          v-if="orders.length > pageSize"
          v-model="currentPage"
          :total-items="orders.length"
          :page-size="pageSize"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  padding: var(--space-xl) 0 var(--space-3xl);
  background-color: var(--color-off-white);
  min-height: calc(100vh - 120px);
}

.orders-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--space-xl);
  gap: var(--space-md);
  flex-wrap: wrap;
}

.orders-eyebrow {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--color-primary-blue);
  letter-spacing: 0.08em;
}

.orders-title {
  font-size: 2rem;
  color: var(--color-deep-blue);
  margin: 2px 0;
}

@media (max-width: 640px) {
  .orders-title {
    font-size: 1.5rem;
  }
}

.orders-sub {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Tabs */
.orders-nav-tabs {
  display: flex;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 4px;
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 18px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  border-radius: var(--radius-pill);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.tab-btn:hover {
  color: var(--color-deep-blue);
}

.tab-btn.is-active {
  background: var(--color-primary-blue);
  color: #FFFFFF;
}

/* Table Cards */
.table-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow-x: auto;
  box-shadow: var(--shadow-xs);
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: inherit;
  font-size: var(--font-size-sm);
  min-width: 650px;
}

.data-table th {
  background: var(--color-off-white);
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  text-align: inherit;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
  text-align: inherit;
}

/* Responsive Table vs Mobile Cards */
.mobile-only-cards {
  display: none;
}

@media (max-width: 767px) {
  .desktop-only-table {
    display: none;
  }

  .mobile-only-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .orders-header {
    margin-bottom: var(--space-md);
    gap: var(--space-sm);
  }

  .orders-nav-tabs {
    width: 100%;
    display: flex;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
    padding: 8px 10px;
    font-size: 0.8125rem;
  }
}

.mobile-order-card,
.mobile-invoice-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.mob-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--color-border-light);
}

.mob-order-num {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-deep-blue);
  font-size: 0.9375rem;
}

.mob-ico {
  color: var(--color-primary-blue);
}

.mob-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.mob-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
}

.mob-label {
  color: var(--color-text-tertiary);
}

.mob-val {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.mob-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-xs);
  border-top: 1px dashed var(--color-border-light);
}

.empty-mobile-card {
  text-align: center;
  padding: var(--space-2xl) var(--space-md);
  background: #FFFFFF;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Table Actions & Expandable Items Subtable */
.table-actions-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-items-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 5px 9px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

.toggle-items-action-btn:hover {
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  border-color: var(--color-primary-blue);
}

.toggle-items-action-btn.is-open {
  background: var(--color-primary-blue);
  color: #FFFFFF;
  border-color: var(--color-primary-blue);
}

.chevron-ico {
  transition: transform var(--dur-fast) ease;
}

.toggle-items-action-btn.is-open .chevron-ico {
  transform: rotate(180deg);
}

.expanded-items-tr {
  background: #f8fafc;
}

.expanded-items-td {
  padding: 12px 20px !important;
  border-bottom: 2px solid var(--color-border) !important;
}

.expanded-items-container {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  box-shadow: var(--shadow-xs);
}

.expanded-items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}

.expanded-title-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  color: var(--color-deep-blue);
}

.items-count-badge {
  color: var(--color-text-tertiary);
  font-size: 0.78rem;
}

.order-ref-hint {
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--color-text-secondary);
}

.sub-items-table-wrapper {
  overflow-x: auto;
}

.sub-items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.sub-items-table th {
  background: #f1f5f9;
  padding: 8px 12px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  text-align: inherit;
}

.sub-items-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-light);
  text-align: inherit;
}

.sub-item-name {
  font-weight: 500;
  color: var(--color-deep-blue);
}

.sub-item-wh {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

/* Mobile Orders Items Expansion */
.mob-toggle-items-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary-blue);
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0;
}

.mob-items-hint {
  font-size: 0.75rem;
  font-weight: 400;
  text-decoration: underline;
}

.mob-expanded-items {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mob-sub-item {
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mob-sub-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.mob-item-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-deep-blue);
}

.mob-sub-item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--color-text-tertiary);
}

/* Order History Filters */
.history-filter-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 12px 16px;
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.status-filters-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 2px 0;
}

.status-filters-pills::-webkit-scrollbar {
  display: none;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.8125rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: #f8fafc;
  border: 1px solid var(--color-border);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.status-pill:hover {
  border-color: var(--color-primary-blue);
  color: var(--color-deep-blue);
  background: #ffffff;
}

.status-pill.is-active {
  background: var(--color-deep-blue);
  color: #ffffff;
  border-color: var(--color-deep-blue);
  box-shadow: 0 2px 4px rgba(10, 37, 64, 0.12);
}

.status-pill.in-progress-pill.is-active {
  background: #0284c7;
  border-color: #0284c7;
}

.status-pill.completed-pill.is-active {
  background: #059669;
  border-color: #059669;
}

.status-pill.refunded-pill.is-active {
  background: #d97706;
  border-color: #d97706;
}

.status-pill.cancelled-pill.is-active {
  background: #dc2626;
  border-color: #dc2626;
}

.count-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  background: rgba(0, 0, 0, 0.06);
  color: inherit;
}

.status-pill.is-active .count-tag {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.history-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 260px;
  flex: 1;
  max-width: 360px;
}

.history-search-wrapper .search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

:dir(rtl) .history-search-wrapper .search-icon {
  left: auto;
  right: 12px;
}

.history-search-input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: #f8fafc;
  font-size: 0.8125rem;
  color: var(--color-text-primary);
  outline: none;
  transition: all var(--dur-fast) var(--ease-smooth);
}

:dir(rtl) .history-search-input {
  padding: 8px 36px 8px 32px;
}

.history-search-input:focus {
  background: #ffffff;
  border-color: var(--color-primary-blue);
  box-shadow: 0 0 0 3px rgba(45, 156, 219, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.1rem;
  line-height: 1;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 50%;
}

:dir(rtl) .clear-search-btn {
  right: auto;
  left: 10px;
}

.clear-search-btn:hover {
  color: var(--color-text-primary);
}

.empty-filter-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-md) 0;
}

.empty-filter-state .empty-icon {
  color: var(--color-text-tertiary);
}

.empty-filter-state .empty-text {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .history-filter-card {
    padding: 10px 12px;
    gap: 10px;
  }
  .history-search-wrapper {
    max-width: 100%;
    min-width: 100%;
  }
  .status-pill {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
}
</style>
