<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import {
  MapPin,
  Plus,
  CheckCircle2,
  Trash2,
  Building2,
  Phone,
  User,
  ChevronRight,
  ChevronDown,
  Truck,
  AlertCircle,
  X,
  Pencil,
  Loader2,
  Navigation,
  ExternalLink
} from 'lucide-vue-next';
import type { Address } from '@/types';
import { useAuth } from '@/composables/useAuth';
import { useI18n } from '@/composables/useI18n';
import { addressService } from '@/services/address.service';
import Button from '@/components/ui/Button.vue';

const { t, locale } = useI18n();
const { addresses, addAddress, updateAddress, removeAddress, setDefaultAddress, fetchAddresses } = useAuth();

// Official Egyptian Governorates (IDs 13-39 aligned with API backend database)
const EGYPTIAN_CITIES: Array<{ id: number; name: string; arabicName: string }> = [
  { id: 13, name: 'Cairo', arabicName: 'القاهرة' },
  { id: 14, name: 'Giza', arabicName: 'الجيزة' },
  { id: 15, name: 'Alexandria', arabicName: 'الإسكندرية' },
  { id: 16, name: 'Menoufia', arabicName: 'المنوفية' },
  { id: 17, name: 'Qalyubia', arabicName: 'القليوبية' },
  { id: 18, name: 'Sharqia', arabicName: 'الشرقية' },
  { id: 19, name: 'Dakahlia', arabicName: 'الدقهلية' },
  { id: 20, name: 'Gharbia', arabicName: 'الغربية' },
  { id: 21, name: 'Beheira', arabicName: 'البحيرة' },
  { id: 22, name: 'Kafr el-Sheikh', arabicName: 'كفر الشيخ' },
  { id: 23, name: 'Fayoum', arabicName: 'الفيوم' },
  { id: 24, name: 'Bani Suef', arabicName: 'بني سويف' },
  { id: 25, name: 'Minya', arabicName: 'المنيا' },
  { id: 26, name: 'Asyut', arabicName: 'أسيوط' },
  { id: 27, name: 'Sohag', arabicName: 'سوهاج' },
  { id: 28, name: 'Qena', arabicName: 'قنا' },
  { id: 29, name: 'Luxor', arabicName: 'الأقصر' },
  { id: 30, name: 'Aswan', arabicName: 'أسوان' },
  { id: 31, name: 'Port Said', arabicName: 'بورسعيد' },
  { id: 32, name: 'Ismailia', arabicName: 'الإسماعيلية' },
  { id: 33, name: 'Suez', arabicName: 'السويس' },
  { id: 34, name: 'Damietta', arabicName: 'دمياط' },
  { id: 35, name: 'Red Sea', arabicName: 'البحر الأحمر' },
  { id: 36, name: 'New Valley', arabicName: 'الوادي الجديد' },
  { id: 37, name: 'Matrouh', arabicName: 'مطروح' },
  { id: 38, name: 'North Sinai', arabicName: 'شمال سيناء' },
  { id: 39, name: 'South Sinai', arabicName: 'جنوب سيناء' }
];

// Arabic display mappings for API returned English area names
const AREA_ARABIC_NAMES: Record<string, string> = {
  '15th of May': '15 مايو',
  'Abbaseya': 'العباسية',
  'Abdeen': 'عابدين',
  'Ain Shams': 'عين شمس',
  'Al Amiriyyah': 'الأميرية',
  'Al Azbakeya': 'الأزبكية',
  'Al Basatin': 'البساتين',
  'Al Darb Al Ahmar': 'الدرب الأحمر',
  'Al Khalifa': 'الخليفة',
  'Al Marg': 'المرج',
  'Al Matareya': 'المطرية',
  'Al Mosky': 'الموسكي',
  'Al Nozha': 'النزهة',
  'Al Rehab': 'الرحاب',
  'Al Salam City': 'مدينة السلام',
  'Al Sayeda Zeinab': 'السيدة زينب',
  'Al Sharabiya': 'الشرابية',
  'Al Shorouk': 'الشروق',
  'Al Tebbin': 'التبين',
  'Al Waili': 'الوايلي',
  'Al Zahraa': 'الزهراء',
  'Andalusia': 'الأندلس',
  'Bab El Shaaria': 'باب الشعرية',
  'Badr City': 'مدينة بدر',
  'Beit El Watan': 'بيت الوطن',
  'Boulaq': 'بولاق أبو العلا',
  'Dar El Salam': 'دار السلام',
  'Degla': 'دجلة المعادي',
  'Downtown Cairo': 'وسط البلد',
  'West El Balad': 'وسط البلد',
  'El Demerdash': 'الدمرداش',
  'El Daher': 'الظاهر',
  'El Gamaliya': 'الجمالية',
  'El Hussein': 'الحسين',
  'El Katameya': 'القطامية',
  'El Maadi': 'المعادي',
  'El Manial': 'المنيل',
  'El Manyal': 'المنيل',
  'El Mokattam': 'المقطم',
  'Mokattam': 'المقطم',
  'El Obour': 'العبور',
  'El Qobba': 'القبة',
  'El Sahel': 'الساحل',
  'El Salam': 'السلام',
  'El Sayeda Aisha': 'السيدة عائشة',
  'El Tagamoa': 'التجمع',
  'El Waily': 'الوايلي',
  'El Zaitoun': 'الزيتون',
  'Ezbet El Nakhl': 'عزبة النخل',
  'Fifth Settlement': 'التجمع الخامس',
  'First Settlement': 'التجمع الأول',
  'Garden City': 'جاردن سيتي',
  'Hadayek El Kobba': 'حدائق القبة',
  'Hadayeq Helwan': 'حدائق حلوان',
  'Heliopolis': 'مصر الجديدة',
  'Helwan': 'حلوان',
  'Korba': 'الكوربة',
  'Maasara': 'المعصرة',
  'Madinaty': 'مدينتي',
  'Manshiyat Naser': 'منشأة ناصر',
  'Masr El Gedida': 'مصر الجديدة',
  'Misr El Gedida': 'مصر الجديدة',
  'Masr El Kadima': 'مصر القديمة',
  'Nasr City': 'مدينة نصر',
  'New Cairo': 'القاهرة الجديدة',
  'New Heliopolis': 'هليوبوليس الجديدة',
  'New Maadi': 'المعادي الجديدة',
  'Ramses': 'رمسيس',
  'Rehab City': 'مدينة الرحاب',
  'Rod El Farag': 'روض الفرج',
  'Roxy': 'روكسي',
  'Sarayat El Maadi': 'سرايات المعادي',
  'Shubra': 'شبرا مصر',
  'Sheraton': 'شيراتون هليوبوليس',
  'Sheraton ': 'شيراتون هليوبوليس',
  'Tora': 'طرة',
  'Zahraa El Maadi': 'زهراء المعادي',
  'Zahraa Nasr City': 'زهراء مدينة نصر',
  'Zamalek': 'الزمالك',
  '6th of October': 'السادس من أكتوبر',
  'First 6th of October': 'أكتوبر الحي الأول',
  'October Gardens': 'حدائق أكتوبر',
  'Hadayek October': 'حدائق أكتوبر',
  'Abu Rawash': 'أبو رواش',
  'Agouza': 'العجوزة',
  'Al Ayyat': 'العياط',
  'Al Badrasheen': 'البدرشين',
  'Al Bahr Al Aazam': 'البحر الأعظم',
  'Al Haram': 'شارع الهرم',
  'Haram': 'الهرم',
  'El Haram': 'الهرم',
  'Al Hawamdeya': 'الحوامدية',
  'Hawamdeya': 'الحوامدية',
  'Al Kawmeya': 'القومية العربية',
  'Al Lebini': 'اللبيني',
  'Al Mariouteya': 'المريوطية',
  'Mariouteya': 'المريوطية',
  'El Mariouteya': 'المريوطية',
  'Al Mansouria': 'المنصورية',
  'Al Moatamadeyah': 'المعتمدية',
  'Al Omraneya': 'العمرانية',
  'El Omraneya': 'العمرانية',
  'Al Remaya': 'ميدان الرماية',
  'El Remaya Square': 'ميدان الرماية',
  'Al Saf': 'الصف',
  'El Saf': 'الصف',
  'Al Talbia': 'الطالبية',
  'El Talbia': 'الطالبية',
  'Talbia': 'الطالبية',
  'Al Warraq': 'الوراق',
  'El Warraq': 'الوراق',
  'Warraq': 'الوراق',
  'Ard El Lewa': 'أرض اللواء',
  'Atfih': 'أطفيح',
  'Awsim': 'أوسيم',
  'Oseem': 'أوسيم',
  'Boulak El Dakrour': 'بولاق الدكرور',
  'Dahshur': 'دهشور',
  'Dokki': 'الدقي',
  'El Ahram Gardens': 'حدائق الأهرام',
  'Hadayek Al Ahram': 'حدائق الأهرام',
  'El Baragil': 'البراجيل',
  'El Hosary': 'ميدان الحصري',
  'El Kilo 21': 'الكيلو 21',
  'El Mohandessin': 'المهندسين',
  'Mohandessin': 'المهندسين',
  'El Munib': 'المنيب',
  'Monib': 'المنيب',
  'El Sheikh Zayed': 'الشيخ زايد',
  'Sheikh Zayed': 'الشيخ زايد',
  'Faisal': 'شارع فيصل',
  'Giza Square': 'ميدان الجيزة',
  'Imbaba': 'إمبابة',
  'Kafr Tohormos': 'كفر طهرمس',
  'Kerdasa': 'كرداسة',
  'Kit Kat': 'الكيت كات',
  'Mit Oqba': 'ميت عقبة',
  'Nazlet El Saman': 'نزلة السمان',
  'Saft El Laban': 'صفط اللبن',
  'Smart Village': 'القرية الذكية'
};



const isModalOpen = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const editingAddressId = ref<string | null>(null);
const isSubmitting = ref(false);
const isLoadingAddresses = ref(false);

const isDeleteModalOpen = ref(false);
const addressToDelete = ref<Address | null>(null);
const isDeleting = ref(false);

const newTitle = ref('');
const selectedCityId = ref<number>(13); // Default to Cairo
const selectedAreaId = ref<number | 'custom' | null>(null);
const customAreaName = ref('');
const newStreet = ref('');
const newBuilding = ref('');
const newFloor = ref('');
const newApartment = ref('');
const newLandmark = ref('');
const newIsDefault = ref(false);
const newLatitude = ref<number | null>(null);
const newLongitude = ref<number | null>(null);
const isDetectingLocation = ref(false);
const locationError = ref<string | null>(null);

function openInGoogleMaps(addr: { latitude?: number | null; longitude?: number | null; cityName?: string; areaName?: string; streetAddress?: string }) {
  if (addr.latitude != null && addr.longitude != null) {
    window.open(`https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`, '_blank', 'noopener,noreferrer');
  } else {
    const query = [addr.streetAddress, addr.areaName, addr.cityName, 'Egypt'].filter(Boolean).join(', ');
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  }
}

function handleDetectCurrentLocation() {
  if (!navigator.geolocation) {
    locationError.value = t('addresses.locationNotSupported');
    return;
  }
  isDetectingLocation.value = true;
  locationError.value = null;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      newLatitude.value = Number(position.coords.latitude.toFixed(6));
      newLongitude.value = Number(position.coords.longitude.toFixed(6));
      isDetectingLocation.value = false;
    },
    (err) => {
      console.warn('Geolocation error:', err);
      locationError.value = t('addresses.locationPermissionDenied');
      isDetectingLocation.value = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function clearDetectedLocation() {
  newLatitude.value = null;
  newLongitude.value = null;
  locationError.value = null;
}

const isLoadingCities = ref(false);
const isLoadingAreas = ref(false);
const availableCities = ref<Array<{ id: number; name: string; arabicName?: string }>>([...EGYPTIAN_CITIES]);
const availableAreas = ref<Array<{ id: number; name: string; arabicName?: string }>>([]);
const areasCache = new Map<number, Array<{ id: number; name: string; arabicName?: string }>>();

function getCityDisplayName(city: { id: number; name: string; arabicName?: string }): string {
  if (locale.value === 'ar') {
    if (city.arabicName) return city.arabicName;
    const found = EGYPTIAN_CITIES.find(c => c.id === city.id || c.name.toLowerCase() === city.name.toLowerCase());
    if (found?.arabicName) return found.arabicName;
  }
  return city.name;
}

function getAreaDisplayName(area: { id: number | string; name: string; arabicName?: string }): string {
  if (locale.value === 'ar') {
    if (area.arabicName) return area.arabicName;
    const trimmed = area.name?.trim() || '';
    if (AREA_ARABIC_NAMES[trimmed]) return AREA_ARABIC_NAMES[trimmed];
  }
  return area.name || '';
}

async function loadCities() {
  isLoadingCities.value = true;
  try {
    const list = await addressService.getCities();
    if (Array.isArray(list) && list.length > 0) {
      availableCities.value = list.map(c => {
        const found = EGYPTIAN_CITIES.find(
          ec => ec.id === c.id || ec.name.toLowerCase() === c.name.toLowerCase()
        );
        return {
          id: c.id,
          name: c.name,
          arabicName: found?.arabicName || c.name
        };
      });
    }
  } catch (err) {
    console.warn('[AddressesView] Failed to load cities from API, using default list:', err);
  } finally {
    isLoadingCities.value = false;
  }
}

async function loadAreasForCity(cityId: number) {
  if (areasCache.has(cityId)) {
    const cached = areasCache.get(cityId)!;
    availableAreas.value = cached;
    if (cached.length > 0) {
      selectedAreaId.value = cached[0].id;
    } else {
      selectedAreaId.value = 'custom';
    }
    return;
  }

  isLoadingAreas.value = true;
  try {
    const list = await addressService.getAreas(cityId);
    let mapped: Array<{ id: number; name: string; arabicName?: string }> = [];

    if (Array.isArray(list) && list.length > 0) {
      mapped = list.map(a => {
        const trimmed = a.name?.trim() || '';
        const arabic = AREA_ARABIC_NAMES[trimmed] || a.arabicName || trimmed;
        return {
          id: a.id,
          name: a.name,
          arabicName: arabic
        };
      });
    }

    areasCache.set(cityId, mapped);
    availableAreas.value = mapped;

    if (mapped.length > 0) {
      selectedAreaId.value = mapped[0].id;
    } else {
      selectedAreaId.value = 'custom';
    }
  } catch (err) {
    console.warn(`[AddressesView] Failed to load areas for city ${cityId}:`, err);
    availableAreas.value = [];
    selectedAreaId.value = 'custom';
  } finally {
    isLoadingAreas.value = false;
  }
}

watch(selectedCityId, (newCityId) => {
  if (newCityId) {
    customAreaName.value = '';
    loadAreasForCity(newCityId);
  }
});

onMounted(async () => {
  isLoadingAddresses.value = true;
  try {
    await Promise.allSettled([
      loadCities(),
      loadAreasForCity(selectedCityId.value),
      fetchAddresses()
    ]);
  } finally {
    isLoadingAddresses.value = false;
  }
});

function handleOpenAddModal() {
  modalMode.value = 'add';
  editingAddressId.value = null;
  newTitle.value = '';
  selectedCityId.value = 13; // Cairo
  customAreaName.value = '';
  newStreet.value = '';
  newBuilding.value = '';
  newFloor.value = '';
  newApartment.value = '';
  newLandmark.value = '';
  newLatitude.value = null;
  newLongitude.value = null;
  locationError.value = null;
  isDetectingLocation.value = false;
  newIsDefault.value = addresses.value.length === 0;

  loadAreasForCity(13);
  isModalOpen.value = true;
}

function handleOpenEditModal(addr: Address) {
  modalMode.value = 'edit';
  editingAddressId.value = addr.id;
  newTitle.value = addr.title || '';

  const cityId = addr.cityId || 13;
  selectedCityId.value = cityId;

  newStreet.value = addr.streetAddress || '';
  newBuilding.value = addr.buildingNumber || '';
  newFloor.value = addr.floor || '';
  newApartment.value = addr.apartment || '';
  newLandmark.value = addr.landmark || '';
  newLatitude.value = addr.latitude ?? null;
  newLongitude.value = addr.longitude ?? null;
  locationError.value = null;
  isDetectingLocation.value = false;
  newIsDefault.value = addr.isDefault || false;

  loadAreasForCity(cityId).then(() => {
    if (addr.areaId) {
      selectedAreaId.value = addr.areaId;
    } else if (addr.areaName) {
      const match = availableAreas.value.find(
        a => a.name.toLowerCase() === addr.areaName.toLowerCase() || a.arabicName === addr.areaName
      );
      if (match) {
        selectedAreaId.value = match.id;
      } else {
        selectedAreaId.value = 'custom';
        customAreaName.value = addr.areaName;
      }
    }
  });

  isModalOpen.value = true;
}

async function handleSaveAddress() {
  if (!newTitle.value || !newStreet.value) return;

  isSubmitting.value = true;
  try {
    const cityObj = availableCities.value.find(c => c.id === selectedCityId.value);
    const cityName = locale.value === 'ar'
      ? (cityObj?.arabicName || cityObj?.name || 'القاهرة')
      : (cityObj?.name || 'Cairo');

    let areaName = '';
    let finalAreaId: number | undefined = undefined;

    if (selectedAreaId.value === 'custom') {
      areaName = customAreaName.value.trim() || t('addresses.centralDistrict');
      finalAreaId = 1;
    } else {
      const areaObj = availableAreas.value.find(a => a.id === selectedAreaId.value);
      if (areaObj) {
        areaName = getAreaDisplayName(areaObj);
        finalAreaId = typeof areaObj.id === 'number' ? areaObj.id : 1;
      } else {
        areaName = t('addresses.centralDistrict');
        finalAreaId = 1;
      }
    }

    const payload = {
      title: newTitle.value.trim(),
      cityId: selectedCityId.value,
      cityName,
      areaId: finalAreaId,
      areaName,
      streetAddress: newStreet.value.trim(),
      buildingNumber: newBuilding.value.trim() || undefined,
      floor: newFloor.value.trim() || undefined,
      apartment: newApartment.value.trim() || undefined,
      landmark: newLandmark.value.trim() || undefined,
      latitude: newLatitude.value,
      longitude: newLongitude.value,
      isDefault: newIsDefault.value
    };

    if (modalMode.value === 'add') {
      await addAddress(payload);
    } else if (editingAddressId.value) {
      await updateAddress(editingAddressId.value, payload);
    }

    isModalOpen.value = false;
  } catch (err) {
    console.error('Failed to save address:', err);
  } finally {
    isSubmitting.value = false;
  }
}

function handlePromptDelete(addr: Address) {
  addressToDelete.value = addr;
  isDeleteModalOpen.value = true;
}

async function handleConfirmDelete() {
  if (!addressToDelete.value) return;
  isDeleting.value = true;
  try {
    await removeAddress(addressToDelete.value.id);
    isDeleteModalOpen.value = false;
    addressToDelete.value = null;
  } catch (err) {
    console.error('Failed to remove address:', err);
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div class="addresses-page">
    <div class="drugza-container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb-row">
        <router-link to="/">{{ t('nav.home') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" />
        <router-link to="/profile">{{ t('nav.profile') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" />
        <span class="current">{{ t('addresses.title') }}</span>
      </nav>

      <!-- Header Row -->
      <div class="page-header-row">
        <div class="header-text-col">
          <span class="eyebrow">{{ t('addresses.logisticsEyebrow') }}</span>
          <h1 class="page-title">{{ t('addresses.title') }}</h1>
          <p class="page-subtitle">
            {{ t('addresses.subtitle') }}
          </p>
        </div>

        <Button variant="cta" size="md" class="add-branch-btn" @click="handleOpenAddModal">
          <Plus :size="16" />
          <span>{{ t('addresses.addBtn') }}</span>
        </Button>
      </div>

      <!-- Loading Skeleton State -->
      <div v-if="isLoadingAddresses" class="addresses-grid" v-loading="isLoadingAddresses">
        <div v-for="i in 3" :key="i" class="address-card skeleton-card">
          <div class="card-top">
            <div class="skeleton-shimmer skeleton-icon"></div>
            <div class="skeleton-meta">
              <div class="skeleton-shimmer skeleton-title"></div>
              <div class="skeleton-shimmer skeleton-tag"></div>
            </div>
          </div>
          <div class="skeleton-details">
            <div class="skeleton-shimmer skeleton-line"></div>
            <div class="skeleton-shimmer skeleton-line-sm"></div>
            <div class="skeleton-shimmer skeleton-line"></div>
          </div>
        </div>
      </div>

      <!-- Address Cards Grid -->
      <div v-else-if="addresses.length > 0" class="addresses-grid" v-loading="isLoadingAddresses">
        <div
          v-for="addr in addresses"
          :key="addr.id"
          class="address-card"
          :class="{ 'is-default': addr.isDefault }"
        >
          <div class="card-top">
            <div class="branch-icon-box">
              <Building2 :size="20" />
            </div>
            <div class="branch-meta">
              <div class="title-default-row">
                <h3 class="branch-name">{{ addr.title }}</h3>
                <span v-if="addr.isDefault" class="default-badge">
                  <CheckCircle2 :size="13" />
                  {{ t('addresses.primaryBadge') }}
                </span>
              </div>
              <span class="city-area-tag">
                {{ addr.cityName }}<template v-if="addr.areaName"> • {{ addr.areaName }}</template>
              </span>
            </div>
          </div>

          <div class="address-details-body">
            <div class="addr-line">
              <MapPin :size="16" class="line-ico" />
              <span>{{ addr.streetAddress }}</span>
            </div>

            <div v-if="addr.buildingNumber || addr.floor || addr.apartment" class="addr-sub-line">
              <span v-if="addr.buildingNumber">{{ t('addresses.buildingLabel') }} <strong>{{ addr.buildingNumber }}</strong></span>
              <span v-if="addr.floor">{{ t('addresses.floorLabel') }} <strong>{{ addr.floor }}</strong></span>
              <span v-if="addr.apartment">{{ t('addresses.aptLabel') }} <strong>{{ addr.apartment }}</strong></span>
            </div>

            <div v-if="addr.landmark && !addr.landmark.toLowerCase().startsWith('apt')" class="landmark-row">
              <span class="landmark-k">{{ t('addresses.landmarkLabel') }}</span>
              <span class="landmark-v">{{ addr.landmark }}</span>
            </div>

            <!-- GPS & Map Direct Link -->
            <div class="location-map-row">
              <button
                type="button"
                class="view-map-link"
                :title="t('addresses.viewOnMap')"
                @click="openInGoogleMaps(addr)"
              >
                <Navigation :size="13" class="map-nav-ico" />
                <span>{{ t('addresses.viewOnMap') }}</span>
                <ExternalLink :size="11" class="map-ext-ico" />
              </button>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="card-footer-actions">
            <button
              v-if="!addr.isDefault"
              type="button"
              class="action-text-btn default-btn"
              @click="setDefaultAddress(addr.id)"
            >
              {{ t('addresses.setAsDefault') }}
            </button>
            <span v-else class="already-default-text">{{ t('addresses.primaryBadge') }}</span>

            <div class="card-btn-group">
              <button
                type="button"
                class="action-text-btn edit-btn"
                :title="t('addresses.edit')"
                @click="handleOpenEditModal(addr)"
              >
                <Pencil :size="15" />
                <span>{{ t('addresses.edit') }}</span>
              </button>

              <button
                type="button"
                class="action-text-btn delete-btn"
                :title="t('addresses.delete')"
                @click="handlePromptDelete(addr)"
              >
                <Trash2 :size="15" />
                <span>{{ t('addresses.delete') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-address-card">
        <MapPin :size="48" class="empty-ico" />
        <h2>{{ t('addresses.emptyTitle') }}</h2>
        <p>{{ t('addresses.emptyDesc') }}</p>
        <Button variant="primary" size="md" @click="handleOpenAddModal">
          <Plus :size="16" />
          <span>{{ t('addresses.addBtn') }}</span>
        </Button>
      </div>
    </div>

    <!-- Unified Add / Edit Address Modal -->
    <div v-if="isModalOpen" class="modal-backdrop" @click.self="isModalOpen = false">
      <div class="modal-card">
        <div class="sheet-drag-handle" aria-hidden="true"></div>
        <div class="modal-header">
          <div>
            <h3 class="modal-title">{{ modalMode === 'edit' ? t('addresses.editTitle') : t('addresses.addNewTitle') }}</h3>
            <p class="modal-sub">{{ t('addresses.modalSub') }}</p>
          </div>
          <button class="modal-close-btn" @click="isModalOpen = false" :aria-label="t('common.close')">
            <X :size="20" />
          </button>
        </div>

        <form @submit.prevent="handleSaveAddress" class="modal-form">
          <div class="form-row">
            <div class="form-group full-width">
              <label>{{ t('addresses.branchTitle') }} *</label>
              <input
                v-model="newTitle"
                type="text"
                :placeholder="t('addresses.branchNamePlaceholder')"
                class="modal-input"
                required
              />
            </div>
          </div>

          <div class="form-row two-cols">
            <!-- Governorate (المحافظة) Dropdown -->
            <div class="form-group">
              <div class="label-with-count">
                <label>{{ t('addresses.govLabel') }}</label>
                <span v-if="isLoadingCities" class="loading-hint">
                  {{ t('common.loading') }}
                </span>
                <span v-else class="count-hint">
                  ({{ t('addresses.govCount', { count: availableCities.length }) }})
                </span>
              </div>
              <div class="select-wrapper">
                <select
                  v-model="selectedCityId"
                  class="modal-input modal-select"
                  :disabled="isLoadingCities"
                  required
                >
                  <option
                    v-for="city in availableCities"
                    :key="city.id"
                    :value="city.id"
                  >
                    {{ getCityDisplayName(city) }}
                  </option>
                </select>
                <ChevronDown :size="16" class="select-caret" />
              </div>
            </div>

            <!-- Area / District (المنطقة / الحي) Dropdown -->
            <div class="form-group">
              <div class="label-with-count">
                <label>{{ t('addresses.districtLabel') }}</label>
                <span v-if="isLoadingAreas" class="loading-hint">
                  {{ t('common.loading') }}
                </span>
                <span v-else-if="availableAreas.length > 0" class="count-hint">
                  ({{ t('addresses.districtCount', { count: availableAreas.length }) }})
                </span>
              </div>
              <div class="select-wrapper">
                <select
                  v-model="selectedAreaId"
                  class="modal-input modal-select"
                  :disabled="isLoadingAreas"
                  required
                >
                  <option :value="null" disabled>
                    {{ t('addresses.selectDistrictDefault') }}
                  </option>
                  <option
                    v-for="area in availableAreas"
                    :key="area.id"
                    :value="area.id"
                  >
                    {{ getAreaDisplayName(area) }}
                  </option>
                  <option value="custom">
                    {{ t('addresses.otherDistrictOption') }}
                  </option>
                </select>
                <ChevronDown :size="16" class="select-caret" />
              </div>
            </div>
          </div>

          <!-- Custom Area Text Input (shown only if 'custom' is selected) -->
          <div v-if="selectedAreaId === 'custom'" class="form-row">
            <div class="form-group full-width">
              <label>{{ t('addresses.customDistrictLabel') }}</label>
              <input
                v-model="customAreaName"
                type="text"
                class="modal-input"
                :placeholder="t('addresses.customDistrictPlaceholder')"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label>{{ t('addresses.streetAddress') }} *</label>
              <input
                v-model="newStreet"
                type="text"
                :placeholder="t('addresses.streetPlaceholder')"
                class="modal-input"
                required
              />
            </div>
          </div>

          <div class="form-row four-cols">
            <div class="form-group">
              <label>{{ t('addresses.buildingNoLabel') }}</label>
              <input v-model="newBuilding" type="text" placeholder="15B" class="modal-input" />
            </div>
            <div class="form-group">
              <label>{{ t('addresses.floorInputLabel') }}</label>
              <input v-model="newFloor" type="text" :placeholder="t('addresses.floorPlaceholder')" class="modal-input" />
            </div>
            <div class="form-group">
              <label>{{ t('addresses.aptInputLabel') }}</label>
              <input v-model="newApartment" type="text" placeholder="3" class="modal-input" />
            </div>
            <div class="form-group">
              <label>{{ t('addresses.landmarkOptional') }}</label>
              <input v-model="newLandmark" type="text" :placeholder="t('addresses.landmarkPlaceholder')" class="modal-input" />
            </div>
          </div>

          <!-- GPS Geolocation & Map Integration -->
          <div class="form-row gps-section-row">
            <div class="gps-card">
              <div class="gps-card-header">
                <div class="gps-title-wrap">
                  <div class="gps-icon-pill">
                    <MapPin :size="16" />
                  </div>
                  <div>
                    <h4 class="gps-heading">{{ t('addresses.coordinatesLabel') }}</h4>
                    <p class="gps-subheading">
                      {{ t('addresses.gpsNotice') }}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  class="detect-gps-btn"
                  :disabled="isDetectingLocation"
                  @click="handleDetectCurrentLocation"
                >
                  <Loader2 v-if="isDetectingLocation" :size="15" class="spin-ico" />
                  <Navigation v-else :size="15" />
                  <span>{{ isDetectingLocation ? t('addresses.detectingLocation') : t('addresses.detectLocation') }}</span>
                </button>
              </div>

              <!-- GPS Coordinates Result Box -->
              <div v-if="newLatitude != null && newLongitude != null" class="gps-result-box success">
                <div class="coords-info">
                  <CheckCircle2 :size="16" class="success-ico" />
                  <span class="location-success-text">{{ t('addresses.locationDetected') }}</span>
                </div>
                <div class="gps-result-actions">
                  <button
                    type="button"
                    class="preview-map-link"
                    @click="openInGoogleMaps({ latitude: newLatitude, longitude: newLongitude })"
                  >
                    <ExternalLink :size="13" />
                    <span>{{ t('addresses.previewOnMap') }}</span>
                  </button>
                  <button
                    type="button"
                    class="clear-gps-btn"
                    :title="t('addresses.clearLocation')"
                    @click="clearDetectedLocation"
                  >
                    <X :size="14" />
                  </button>
                </div>
              </div>

              <!-- Geolocation Error Box -->
              <div v-else-if="locationError" class="gps-result-box error">
                <AlertCircle :size="16" class="error-ico" />
                <span class="error-msg">{{ locationError }}</span>
              </div>
            </div>
          </div>

          <div class="form-row checkbox-row">
            <label class="check-label">
              <input v-model="newIsDefault" type="checkbox" class="modal-checkbox" />
              <span>{{ t('addresses.setDefaultPrompt') }}</span>
            </label>
          </div>

          <div class="modal-footer">
            <Button variant="ghost" size="md" type="button" :disabled="isSubmitting" @click="isModalOpen = false">
              {{ t('addresses.cancelBtn') }}
            </Button>
            <Button variant="primary" size="md" type="submit" :loading="isSubmitting">
              {{ isSubmitting ? t('addresses.saving') : t('addresses.saveBtn') }}
            </Button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="isDeleteModalOpen" class="modal-backdrop" @click.self="isDeleteModalOpen = false">
      <div class="modal-card modal-card-sm">
        <div class="delete-icon-circle">
          <Trash2 :size="28" />
        </div>
        <h3 class="modal-title text-center">{{ t('addresses.deleteTitle') }}</h3>
        <p class="modal-sub text-center">
          {{ t('addresses.deleteConfirm', { name: addressToDelete?.title || addressToDelete?.streetAddress }) }}
          <br>
          <span class="warning-text">{{ t('addresses.deleteWarning') }}</span>
        </p>
        <div class="modal-footer modal-footer-center">
          <Button variant="ghost" size="md" type="button" :disabled="isDeleting" @click="isDeleteModalOpen = false">
            {{ t('addresses.cancelBtn') }}
          </Button>
          <Button variant="danger" size="md" type="button" :loading="isDeleting" @click="handleConfirmDelete">
            {{ isDeleting ? t('addresses.deleting') : t('addresses.confirmDeleteBtn') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.addresses-page {
  padding: var(--space-xl) 0 var(--space-3xl);
  background-color: var(--color-off-white);
  min-height: calc(100vh - 120px);
  width: 100%;
  overflow-x: hidden;
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-lg);
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
}

.breadcrumb-row::-webkit-scrollbar {
  display: none;
}

.breadcrumb-row a {
  color: var(--color-text-secondary);
  transition: color var(--dur-fast);
  flex-shrink: 0;
}

.breadcrumb-row a:hover {
  color: var(--color-primary-blue);
}

.breadcrumb-row .current {
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.arrow-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition: transform var(--dur-fast);
}

[dir="rtl"] .arrow-icon {
  transform: rotate(180deg);
}

.page-header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
  flex-wrap: wrap;
}

.header-text-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 680px;
  min-width: 0;
  flex: 1 1 300px;
}

.add-branch-btn {
  flex-shrink: 0;
}

.eyebrow {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--color-primary-blue);
  letter-spacing: 0.08em;
  line-height: 1.4;
  display: inline-block;
}

.page-title {
  font-size: clamp(1.35rem, 4vw, 2rem);
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  margin: 2px 0 4px;
  line-height: 1.25;
  word-break: break-word;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  max-width: 620px;
  line-height: 1.5;
}

/* Grid */
.addresses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-lg);
  width: 100%;
}

.address-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  transition: all var(--dur-base) var(--ease-smooth);
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.address-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: rgba(32, 138, 174, 0.4);
}

.address-card.is-default {
  border-color: var(--color-primary-blue);
  box-shadow: 0 4px 14px rgba(25, 118, 173, 0.12);
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.branch-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.branch-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-grow: 1;
  min-width: 0;
}

.title-default-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.branch-name {
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  line-height: 1.3;
  word-break: break-word;
}

.default-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: 0.6875rem;
  font-weight: var(--font-weight-semibold);
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
  flex-shrink: 0;
}

.city-area-tag {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  word-break: break-word;
}

.address-details-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.addr-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--color-deep-blue);
  word-break: break-word;
  line-height: 1.4;
}

.line-ico {
  color: var(--color-primary-blue);
  flex-shrink: 0;
  margin-top: 3px;
}

.addr-sub-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background: var(--color-off-white);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  word-break: break-word;
}

.landmark-row {
  font-size: 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  word-break: break-word;
  line-height: 1.4;
}

.landmark-k {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.landmark-v {
  color: var(--color-deep-blue);
  word-break: break-word;
}

.contact-info-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: 4px;
  flex-wrap: wrap;
}

.contact-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background: var(--color-off-white);
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  max-width: 100%;
  min-width: 0;
}

.contact-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.instructions-box {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: #FFF9F2;
  border: 1px solid rgba(230, 126, 34, 0.2);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: #9A3412;
  word-break: break-word;
  line-height: 1.4;
}

.inst-ico {
  color: #EA580C;
  flex-shrink: 0;
  margin-top: 2px;
}

.card-footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border-light);
  margin-top: auto;
}

.action-text-btn {
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: var(--radius-xs);
  transition: all var(--dur-fast) var(--ease-smooth);
  background: transparent;
  border: none;
}

.default-btn {
  color: var(--color-primary-blue);
}

.default-btn:hover {
  background: var(--color-primary-blue-light);
}

.already-default-text {
  font-size: 0.75rem;
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
}

.delete-btn {
  color: var(--color-text-tertiary);
}

.delete-btn:hover {
  color: var(--color-error);
  background: var(--color-error-bg);
}

.card-btn-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-inline-start: auto;
}

.edit-btn {
  color: var(--color-primary-blue);
}

.edit-btn:hover {
  background: var(--color-primary-blue-light);
}

.modal-card-sm {
  max-width: 440px !important;
  text-align: center;
  padding: var(--space-xl);
}

.delete-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #FEE2E2;
  color: #DC2626;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-md);
}

.text-center {
  text-align: center;
}

.warning-text {
  font-size: 0.8rem;
  color: #DC2626;
  margin-top: 6px;
  display: inline-block;
}

.modal-footer-center {
  justify-content: center !important;
  gap: 12px;
  margin-top: var(--space-lg);
}

/* Skeleton loader */
.skeleton-card {
  min-height: 240px;
  background: #FFFFFF;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: shimmerAnim 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
}

.skeleton-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  width: 60%;
  height: 20px;
}

.skeleton-tag {
  width: 35%;
  height: 14px;
}

.skeleton-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-line {
  width: 90%;
  height: 14px;
}

.skeleton-line-sm {
  width: 50%;
  height: 14px;
}

@keyframes shimmerAnim {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty State */
.empty-address-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-3xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  max-width: 580px;
  margin: var(--space-2xl) auto;
  box-sizing: border-box;
}

.empty-ico {
  color: var(--color-primary-blue);
  margin-bottom: var(--space-xs);
}

/* Page Media Queries */
@media (max-width: 1024px) {
  .addresses-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }
}

@media (max-width: 680px) {
  .addresses-page {
    padding: var(--space-md) 0 var(--space-2xl);
  }

  .page-header-row {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
  }

  .header-text-col {
    max-width: 100%;
    flex: 1 1 100%;
  }

  .add-branch-btn {
    width: 100%;
    justify-content: center;
  }

  .addresses-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .address-card {
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    gap: var(--space-sm);
  }

  .empty-address-card {
    padding: var(--space-xl) var(--space-md);
    margin: var(--space-lg) auto;
    border-radius: var(--radius-xl);
  }
}

@media (max-width: 380px) {
  .breadcrumb-row {
    font-size: 0.6875rem;
    gap: 4px;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .page-subtitle {
    font-size: 0.75rem;
  }

  .address-card {
    padding: 12px;
  }

  .branch-icon-box {
    width: 36px;
    height: 36px;
  }

  .branch-name {
    font-size: 0.9375rem;
  }

  .contact-info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .contact-chip {
    width: 100%;
  }
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(18, 73, 107, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  animation: fadeIn 0.2s ease-out;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal-card {
  background: #FFFFFF;
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 620px;
  max-height: min(90vh, 90dvh);
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: var(--shadow-xl);
  padding: var(--space-xl);
  box-sizing: border-box;
  position: relative;
}

.sheet-drag-handle {
  display: none;
}

/* Custom Sleek Scrollbar */
.modal-card::-webkit-scrollbar {
  width: 6px;
}
.modal-card::-webkit-scrollbar-track {
  background: transparent;
}
.modal-card::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 999px;
}
.modal-card::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  line-height: 1.3;
}

.modal-sub {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-top: 4px;
  line-height: 1.4;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--dur-fast);
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: var(--color-off-white);
  color: var(--color-deep-blue);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  width: 100%;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: var(--space-md);
  width: 100%;
  box-sizing: border-box;
}

.form-row.two-cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
  width: 100%;
}

.form-row.three-cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr);
  gap: var(--space-md);
  width: 100%;
}

.form-row.four-cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr);
  gap: var(--space-md);
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.form-group.full-width {
  width: 100%;
  flex: 1 1 100%;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  display: block;
}

.modal-input,
.modal-textarea {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  font-family: inherit;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  font-size: 0.875rem;
  outline: none;
  background: var(--color-off-white);
  color: var(--color-deep-blue);
  transition: border-color var(--dur-fast), background var(--dur-fast), box-shadow var(--dur-fast);
}

.modal-input:focus,
.modal-textarea:focus {
  border-color: var(--color-primary-blue);
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(32, 138, 174, 0.12);
}

.phone-input {
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
}

.modal-textarea {
  resize: vertical;
  min-height: 64px;
  line-height: 1.5;
}

.label-with-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.count-hint {
  font-size: 0.6875rem;
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.loading-hint {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  font-style: italic;
  white-space: nowrap;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.modal-select {
  width: 100%;
  min-width: 0;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-inline-end: 34px;
  cursor: pointer;
  background-color: var(--color-off-white);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.select-caret {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-end: 12px;
  pointer-events: none;
  color: var(--color-text-secondary);
}

.checkbox-row {
  align-items: center;
}

.check-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8125rem;
  color: var(--color-deep-blue);
  cursor: pointer;
  user-select: none;
}

.modal-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary-blue);
  cursor: pointer;
  border-radius: 4px;
}

/* Location & Maps UI */
.location-map-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed var(--color-border-light);
  flex-wrap: wrap;
}

.view-map-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(32, 138, 174, 0.08);
  color: var(--color-primary-blue);
  border: 1px solid rgba(32, 138, 174, 0.2);
  padding: 4px 10px;
  border-radius: var(--radius-full, 999px);
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  transition: all var(--dur-fast, 0.15s) ease;
}

.view-map-link:hover {
  background: var(--color-primary-blue);
  color: #FFFFFF;
  border-color: var(--color-primary-blue);
  box-shadow: 0 2px 8px rgba(32, 138, 174, 0.25);
  transform: translateY(-1px);
}

.map-nav-ico,
.map-ext-ico {
  flex-shrink: 0;
}

/* Modal GPS Geolocation Section */
.gps-section-row {
  width: 100%;
}

.gps-card {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-sm, 12px) var(--space-md, 16px);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gps-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.gps-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1 1 240px;
}

.gps-icon-pill {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(32, 138, 174, 0.12);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.gps-heading {
  font-size: 0.84rem;
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-deep-blue);
  margin: 0 0 2px;
  line-height: 1.3;
}

.gps-subheading {
  font-size: 0.72rem;
  color: var(--color-text-tertiary);
  margin: 0;
  line-height: 1.4;
}

.detect-gps-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  color: var(--color-primary-blue);
  border: 1px solid rgba(32, 138, 174, 0.3);
  padding: 6px 12px;
  border-radius: var(--radius-md, 8px);
  font-size: 0.78rem;
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  transition: all var(--dur-fast, 0.15s) ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.detect-gps-btn:hover:not(:disabled) {
  background: rgba(32, 138, 174, 0.08);
  border-color: var(--color-primary-blue);
  transform: translateY(-1px);
}

.detect-gps-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spin-ico {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.gps-result-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  flex-wrap: wrap;
}

.gps-result-box.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.gps-result-box.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.coords-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.location-success-text {
  font-size: 0.78rem;
  font-weight: 500;
  color: #166534;
}

.gps-result-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-map-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #FFFFFF;
  color: #166534;
  border: 1px solid #86efac;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preview-map-link:hover {
  background: #dcfce7;
}

.clear-gps-btn {
  background: transparent;
  border: none;
  color: #991b1b;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.clear-gps-btn:hover {
  background: rgba(153, 27, 27, 0.1);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border-light);
  margin-top: var(--space-xs);
  width: 100%;
}

@media (max-width: 640px) {
  .modal-backdrop {
    padding: 0;
    align-items: flex-end; /* Mobile Bottom Sheet to prevent top clipping */
  }

  .modal-card {
    padding: var(--space-md) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom, 16px));
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
    max-height: 88dvh;
    max-height: 88vh;
    width: 100%;
    margin: 0;
    box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.25);
  }

  .modal-card.modal-card-sm {
    border-radius: var(--radius-2xl);
    margin: auto 12px 24px;
    width: calc(100% - 24px);
  }

  .sheet-drag-handle {
    display: block;
    width: 44px;
    height: 5px;
    background: var(--color-border);
    border-radius: 999px;
    margin: -4px auto 14px;
    opacity: 0.9;
  }

  .modal-header {
    position: sticky;
    top: -16px;
    background: #FFFFFF;
    z-index: 20;
    padding-top: 4px;
    padding-bottom: 10px;
    margin-top: -4px;
    margin-bottom: var(--space-md);
    border-bottom: 1px solid var(--color-border-light);
  }

  .modal-title {
    font-size: 1.15rem;
  }

  .modal-sub {
    font-size: 0.75rem;
  }

  .form-row.two-cols {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }

  .form-row.three-cols {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .form-row.three-cols .form-group:last-child {
    grid-column: 1 / -1;
  }

  /* 4-columns layout on mobile: 2x2 grid with Landmark taking full width */
  .form-row.four-cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .form-row.four-cols .form-group:last-child {
    grid-column: 1 / -1;
  }

  .modal-footer {
    flex-direction: column-reverse;
    gap: 8px;
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
  }

  .modal-footer :deep(.drugza-btn) {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 440px) {
  .modal-card {
    max-height: 90dvh;
    padding: 12px 14px calc(14px + env(safe-area-inset-bottom, 16px));
  }

  .modal-header {
    margin-bottom: 10px;
  }

  .modal-title {
    font-size: 1.05rem;
  }

  .form-row.four-cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .form-row.four-cols .form-group:last-child {
    grid-column: 1 / -1;
  }

  .modal-input {
    padding: 8px 10px;
    font-size: 0.8125rem;
  }

  .gps-card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .detect-gps-btn {
    width: 100%;
    justify-content: center;
    padding: 8px 12px;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
