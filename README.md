# 🏥 الدليل الشامل لربط وتطوير متجر دروجزا الإلكتروني (Drugza Store Frontend Integration Guide)

> هذا الدليل تم إعداده خصيصاً لمطور الفرونت إند (Frontend Developer) لبناء متجر صيدليات إلكتروني كامل (B2B Pharmacy Online Store) بالاعتماد على واجهات برمجية [Drugza API Swagger](https://drugzaapi.runasp.net/swagger/index.html).
> يشمل هذا التوثيق كل Endpoint سيحتاجه الفرونت إند، مرتبة بالتسلسل المنطقي لرحلة المستخدم: من التسجيل وتسجيل الدخول مروراً بتصفح المنتجات والبحث بالمواد الفعالة ومقارنة المخازن والسلة وإتمام الطلب وحتى تتبع الشحن والمرتجعات والحسابات المالية.

---

## 📌 الفهرس التفصيلي

1. [الإعدادات العامة والربط الأساسي (Base URL & Headers)](#1-الإعدادات-العامة-والربط-الأساسي-base-url--headers)
2. [المرحلة 1: البيانات الجغرافية والتجهيز للتسجيل (Lookup & Location APIs)](#المرحلة-1-البيانات-الجغرافية-والتجهيز-للتسجيل-lookup--location-apis)
3. [المرحلة 2: المصادقة والحساب (Auth, OTP & Pharmacy Profile)](#المرحلة-2-المصادقة-والحساب-auth-otp--pharmacy-profile)
4. [المرحلة 3: إدارة عناوين الصيدلية ورسوم الشحن (Pharmacy Addresses & Shipping)](#المرحلة-3-إدارة-عناوين-الصيدلية-ورسوم-الشحن-pharmacy-addresses--shipping)
5. [المرحلة 4: شاشة المتجر الرئيسية (Storefront Home Page)](#المرحلة-4-شاشة-المتجر-الرئيسية-storefront-home-page)
6. [المرحلة 5: تصفح الكتالوج، التصنيفات، والشركات (Catalog, Brands & Categories)](#المرحلة-5-تصفح-الكتالوج-التصنيفات-والشركات-catalog-brands--categories)
7. [المرحلة 6: محرك البحث الذكي وبدائل الأدوية بالمادة الفعالة (Smart Search & Generic Equivalents)](#المرحلة-6-محرك-البحث-الذكي-وبدائل-الأدوية-بالمادة-الفعالة-smart-search--generic-equivalents)
8. [المرحلة 7: تفاصيل المنتج وتعدد أسعار المخازن (Product Details & Multi-Vendor Pricing)](#المرحلة-7-تفاصيل-المنتج-وتعدد-أسعار-المخازن-product-details--multi-vendor-pricing)
9. [المرحلة 8: المفضلة والطلب السريع (Favorites & Wishlist)](#المرحلة-8-المفضلة-والطلب-السريع-favorites--wishlist)
10. [المرحلة 9: سلة المشتريات متعددة المخازن (Cart Management)](#المرحلة-9-سلة-المشتريات-متعددة-المخازن-cart-management)
11. [المرحلة 10: مرحلة إتمام الطلب والدفع (Checkout & Order Placement)](#المرحلة-10-مرحلة-إتمام-الطلب-والدفع-checkout--order-placement)
12. [المرحلة 11: إدارة وتتبع الطلبيات وحالاتها (Orders Management & Tracking)](#المرحلة-11-إدارة-وتتبع-الطلبيات-وحالاتها-orders-management--tracking)
13. [المرحلة 12: نظام مرتجعات الأدوية (Return Orders Workflow)](#المرحلة-12-نظام-مرتجعات-الأدوية-return-orders-workflow)
14. [المرحلة 13: المحفظة والرصيد والائتمان المالي (Wallet, Balances & Credit Limit)](#المرحلة-13-المحفظة-والرصيد-والائتمان-المالي-wallet-balances--credit-limit)
15. [المرحلة 14: الفواتير الضريبية للطلبيات (Invoices)](#المرحلة-14-الفواتير-الضريبية-للطلبيات-invoices)
16. [المرحلة 15: الإشعارات اللحظية وسياسات المتجر (Notifications & Policies)](#المرحلة-15-الإشعارات-اللحظية-وسياسات-المتجر-notifications--policies)
17. [جدول ملخص لكافة الـ Endpoints والصلاحيات المطلوبة](#17-جدول-ملخص-لكافة-الـ-endpoints-والصلاحيات-المطلوبة)
18. [تنبيهات وأخطاء شائعة في الباك إند (Crucial Backend Quirks & Caveats)](#18-تنبيهات-وأخطاء-شائعة-في-الباك-إند-crucial-backend-quirks--caveats)

---

## 1. الإعدادات العامة والربط الأساسي (Base URL & Headers)

* **الرابط الأساسي (Base URL)**:
  ```text
  https://drugzaapi.runasp.net
  ```
* **ترويسة المصادقة (Authentication Header)**:
  لجميع الطلبات التي تتطلب صلاحيات (بعد تسجيل الدخول):
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```
* **دعم اللغة العربية والإنجليزية**:
  معظم طلبات الـ GET الخاصة بالمنتجات والتصنيفات تدعم إرسال:
  `?lang=ar` أو `?lang=en`
* **مسار الصور والملفات المرفوعة**:
  الصور المخزنة في النظام تتوفر تحت:
  `https://drugzaapi.runasp.net/Uploads/...` أو عبر `GET /api/files/{fileName}`.

---

## المرحلة 1: البيانات الجغرافية والتجهيز للتسجيل (Lookup & Location APIs)

قبل أن تسجل الصيدلية حسابها، يحتاج الفرونت إند إلى ملء قوائم الاختيار (Dropdowns) للدول، المدن، والمناطق الجغرافية.

### 1. جلب قائمة الدول المتاحة
* **Endpoint**: `GET /api/Countries/all-countries`
* **Auth**: غير مطلوب (Public)
* **استخدام الفرونت**: ملء حقل الدولة في نموذج التسجيل.
* **الاستجابة المتوقعة**:
  ```json
  [
    {
      "id": 1,
      "name": "Egypt",
      "arName": "مصر"
    }
  ]
  ```

### 2. جلب المدن التابعة لدولة معينة
* **Endpoint**: `GET /api/Cities/GetByCountryId/{countryId}`
* **Auth**: غير مطلوب (Public)
* **Path Parameter**: `countryId` (رقم الدولة، مثال: `1`).
* **استخدام الفرونت**: عند اختيار الدولة، يتم جلب المدن التابعة لها لتعبئة قائمة المدن.

### 3. جلب المناطق التابعة لمدينة معينة
* **Endpoint**: `GET /api/Area/GetByCityId/{cityId}`
* **Auth**: غير مطلوب (Public)
* **Path Parameter**: `cityId` (رقم المدينة).
* **استخدام الفرونت**: عند اختيار المدينة، يتم جلب المناطق المتاحة (مثل: الدقي، المهندسين، النزهة...) لاختيار منطقة الصيدلية بدقة لتحديد مواعيد التسليم وتغطية المخازن.

### 4. جلب الزونات الجغرافية (Zones)
* **Endpoint**: `GET /api/Zones/all-zones`
* **Auth**: غير مطلوب (Public)
* **استخدام الفرونت**: تحديد نطاق تغطية الصيدلية إن تطلب الأمر.

---

## المرحلة 2: المصادقة والحساب (Auth, OTP & Pharmacy Profile)

### 1. تسجيل حساب صيدلية جديد (Pharmacy Registration)
* **Endpoint**: `POST /api/Users/register`
* **Auth**: غير مطلوب (Public)
* **Content-Type**: `multipart/form-data`
* **بيانات الفورم (FormData Body)**:
  * `BussinesName` (string): اسم الصيدلية التجاري (مثال: "صيدلية النور والشفاء").
  * `FullName` (string): اسم الدكتور أو المسؤول (مثال: "د. أحمد محمود").
  * `Email` (string): البريد الإلكتروني.
  * `Password` (string): كلمة المرور.
  * `PhoneNumber` (string): رقم هاتف الصيدلية أو المحمول.
  * `CountryId` (int): معرّف الدولة.
  * `CityId` (int): معرّف المدينة.
  * `AreaId` (int): معرّف المنطقة.
  * `AddressLines` (string): العنوان بالتفصيل.
  * `IsActive` (boolean): `true`.
  * `ProfileImage` (File / Binary): صورة السجل التجاري أو رخصة الصيدلية أو شعار الصيدلية.
* **سلوك الفرونت إند**: بعد إرسال الفورم بنجاح، يتم تحويل الصيدلي لصفحة تفعيل الحساب عبر رمز الـ OTP.

### 2. تأكيد وتفعيل الحساب بالـ OTP
* **Endpoint**: `POST /api/Users/verify-otp`
* **Auth**: غير مطلوب
* **Query Parameters**:
  * `email` (string): بريد الصيدلية المسجل.
  * `code` (string): رمز التحقق المرسل.

### 3. إعادة إرسال رمز التحقق (Resend OTP)
* **Endpoint**: `POST /api/Users/resend-otp`
* **Query Parameter**: `email` (string).

### 4. تسجيل الدخول (Pharmacy Login)
* **Endpoint**: `POST /api/Users/login`
* **Auth**: غير مطلوب (Public)
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "usernameOrEmail": "pharmacy@example.com",
    "password": "StrongPassword123!"
  }
  ```
* **الاستجابة وحفظ الحالة (Auth State)**:
  * يعود الباك إند برمز المصادقة (Bearer Token) ومعرّف المستخدم (`userId`) وبيانات الصيدلية والصلاحيات.
  * **إجراء الفرونت إند**:
    1. حفظ الـ Token في `localStorage` أو كوكيز آمنة.
    2. حفظ `userId` وبيانات الصيدلية في حالة عامة (`AuthContext` أو `Pinia` أو `Redux`).
    3. ضبط Axios/Fetch Interceptor لتمرير `Authorization: Bearer <token>` تلقائياً في كل الطلبات اللاحقة.

### 5. نسيان واستعادة كلمة المرور
* **طلب كود الاستعادة**: `POST /api/Users/forget-password?email={email}`
* **إعادة تعيين كلمة المرور الجديدة**: `POST /api/Users/reset-password?email={email}&newPassword={newPassword}`

### 6. جلب بيانات ملف الصيدلية (Profile)
* **Endpoint**: `GET /api/Users/user/{userId}`
* **Auth**: مطلوب (`Bearer Token`)
* **Path Parameter**: `userId` (GUID الخاص بالصيدلية).
* **استخدام الفرونت إند**: عرض بيانات الحساب، الرصيد، نسبة الخصم المعتمدة، وساعات العمل.

### 7. تحديث بيانات الصيدلية
* **Endpoint**: `PUT /api/Users/{id}`
* **Auth**: مطلوب (`Bearer Token`)
* **Content-Type**: `multipart/form-data` أو JSON بحسب الحقول المحدثة.

### 8. تغيير كلمة المرور من داخل الحساب
* **Endpoint**: `POST /api/Users/ChangePassword`
* **Auth**: مطلوب
* **Request Body**:
  ```json
  {
    "userId": "guid-here",
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456"
  }
  ```

### 9. حفظ رمز الإشعارات (FCM Push Notifications Token)
* **Endpoint**: `POST /api/Users/save-fcm-token`
* **Auth**: مطلوب
* **Request Body**:
  ```json
  {
    "userId": "guid-here",
    "token": "firebase-fcm-registration-token"
  }
  ```

---

## المرحلة 3: إدارة عناوين الصيدلية ورسوم الشحن (Pharmacy Addresses & Shipping)

الصيدلية قد تمتلك أكثر من فرع أو مخزن استلام:

### 1. استعراض عناوين الصيدلية المحفوظة
* **Endpoint**: `GET /api/Address/get-user-Addresses`
* **Auth**: مطلوب
* **الاستجابة**: قائمة بكافة عناوين الصيدلية المسجلة مع تفاصيل المنطقة والشارع ورقم الطابق.

### 2. إضافة عنوان توصيل جديد
* **Endpoint**: `POST /api/Address/insert-address`
* **Auth**: مطلوب
* **Request Body**:
  ```json
  {
    "userId": "guid-user-id",
    "addressLine": "شارع التحرير، عمارة 15، أمام مستشفى المعلمين",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "floorNum": 1,
    "apartmentNum": 2,
    "areaId": 5
  }
  ```

### 3. تعديل عنوان موجود
* **Endpoint**: `PUT /api/Address/update-address/{id}`
* **Path Parameter**: `id` (GUID للعنوان).
* **Request Body**:
  ```json
  {
    "addressLine": "العنوان المحدث بالتفصيل"
  }
  ```

### 4. حذف عنوان
* **Endpoint**: `DELETE /api/Address/delete-address/{id}`

### 5. حساب رسوم الشحن والتوصيل لعنوان محدد
* **Endpoint**: `GET /api/Address/GetShippingFess/{addressId}`
* **Path Parameter**: `addressId` (GUID).
* **استخدام الفرونت إند**: إظهار قيمة التوصيل التقديرية في ملخص الفاتورة قبل إتمام الطلب.

---

## المرحلة 4: شاشة المتجر الرئيسية (Storefront Home Page)

الصفحة الرئيسية هي واجهة الصيدلي الأولى لاكتشاف العروض والخصومات والمخازن:

### 1. بيانات الهيكل العام للرئيسية (Home Feed Aggregate)
* **Endpoint**: `GET /api/Home/GetHome`
* **Auth**: غير مطلوب (Public)
* **الاستجابة**: كائن مجمع يحتوي على:
  * `banners`: البانرات الإعلانية المتحركة (Sliders) بروابطها وصورها.
  * `categories`: أهم الأقسام والتصنيفات الشائعة.
  * `inventories` / `providers`: أبرز الموردين ومخازن الأدوية المعتمدة.

### 2. جلب سلايدر البانرات الإعلانية
* **Endpoint**: `GET /api/Banners`
* **استخدام الفرونت إند**: بناء شريط العروض المتحرك (Hero Slider) في أعلى الشاشة.

### 3. عروض التخفيضات الكبرى الحية (Flash Sales)
* **Endpoint**: `GET /api/ProductPrices/flash-sale`
* **Auth**: مطلوب
* **استخدام الفرونت إند**: قسم "عروض فلاش سيل مؤقتة" يحتوي على عداد تنازلي (Countdown Timer) بناءً على تواريخ `flashSaleFromDate` و `flashSaleToDate`.

### 4. العروض الخاصة والتخفيضات (Special Offers)
* **Endpoint**: `GET /api/SpecialOffers/get-offers`
* **استخدام الفرونت إند**: عرض بطاقات الخصومات الخاصة المتاحة للصيدليات.

### 5. المنتجات الأكثر طلباً والأعلى مبيعاً (Popular Products)
* **Endpoint**: `GET /api/Products/popularproducts`
* **Auth**: مطلوب
* **استخدام الفرونت إند**: قائمة "الأكثر طلباً بين الصيدليات" لتسهيل الشراء السريع للأدوية اليومية.

### 6. قائمة أفضل الموردين ومخازن الأدوية (Top Providers)
* **Endpoint**: `GET /api/Users/get-top-providers` أو `GET /api/Users/get-providers`
* **Auth**: مطلوب
* **استخدام الفرونت إند**: إظهار لوجو وأسماء مخازن الأدوية الكبرى لتمكين الصيدلي من التسوق مباشرة من مخزن محدد يفضله.

---

## المرحلة 5: تصفح الكتالوج، التصنيفات، والشركات (Catalog, Brands & Categories)

### 1. جلب التصنيفات الرئيسية (Main Categories)
* **Endpoint**: `GET /api/MainCategories?lang=ar&page=1&pageSize=20`
* **Auth**: غير مطلوب
* **البيانات**: مثل (أدوية بشرية، مستلزمات طبية، أجهزة طبية، عناية شخصية).

### 2. جلب التصنيفات الفرعية المرتبطة بقسم رئيسي
* **Endpoint**: `GET /api/MainCategories/{mainCategoryId}/categories?lang=ar`
* **Path Parameter**: `mainCategoryId` (GUID).
* **البيانات**: مثل (مسكنات، مضادات حيوية، فيتامينات...).

### 3. جلب جميع التصنيفات
* **Endpoint**: `GET /api/Categories?lang=ar`

### 4. تصفح منتجات تصنيف رئيسي
* **Endpoint**: `GET /api/MainCategories/{categoryId}/products?lang=ar&page=1&pageSize=20&search=&sort=`
* **Query Parameters**:
  * `page`: رقم الصفحة.
  * `pageSize`: عدد العناصر.
  * `search`: كلمة بحث إضافية.
  * `sort`: ترتيب بحسب السعر أو الأحدث.

### 5. تصفح شركات الأدوية والمصنعين (Brands)
* **Endpoint**: `GET /api/Brands/all-brands`
* **استخدام الفرونت إند**: فلترة المنتجات بحسب الشركة المصنعة (مثل: فاركو، إيفا فارما، نوفارتس...).
* **جلب منتجات شركة معينة**:
  * `GET /api/Products/products-bybrand/{brandId}?page=1&size=20`

### 6. تصفح منتجات مخزن/مورد محدد (Shop by Inventory)
* **Endpoint**: `GET /api/ProductPrices/by-inventory-user/{inventoryId}?catId=&page=1&pageSize=20&search=`
* **استخدام الفرونت إند**: عندما يدخل الصيدلي على صفحة مخزن معين لطلب أصناف منه واستيفاء الحد الأدنى للطلب.

---

## المرحلة 6: محرك البحث الذكي وبدائل الأدوية بالمادة الفعالة (Smart Search & Generic Equivalents)

ميزة تنافسية حاسمة في متجر الأدوية B2B:

### 1. البحث العام المباشر في الأدوية
* **Endpoint**: `GET /api/Products/search-product?search={term}&page=1&pageSize=20`
* **استخدام الفرونت إند**: شريط البحث المباشر (Autocomplete Search bar) بالاسم التجاري باللغة العربية أو الإنجليزية أو كود الدواء.

### 2. البحث والتصفح بالـ مادة الفعالة (Active Ingredients)
* **Endpoint**: `GET /api/ActiveIngerients?search={ingredientName}&pageNumber=1&pageSize=20`
* **الاستخدام**: البحث عن اسم المادة الكيميائية (مثال: `Paracetamol` أو `Ibuprofen`).

### 3. إظهار البدائل والمثائل الدوائية (Generic Equivalents / Alternatives)
* **كيف يعمل في الفرونت إند**:
  1. كل منتج (`Product`) يحمل خاصية `activeIngerdientId`.
  2. عندما يفتح الصيدلي دواء معين ويجده نافداً في المخازن، أو يريد بديلاً بخصم أعلى، يقوم الفرونت إند بطلب الأدوية التي تشترك في نفس `activeIngerdientId`.
  3. يظهر قسم في صفحة المنتج: *"أدوية بديلة بنفس المادة الفعالة والتركيز"*.

---

## المرحلة 7: تفاصيل المنتج وتعدد أسعار المخازن (Product Details & Multi-Vendor Pricing)

### 1. جلب بيانات الدواء الأساسي
* **Endpoint**: `GET /api/Products/{id}?lang=ar`
* **Path Parameter**: `id` (GUID الخاص بالدواء).
* **البيانات المستلمة**: الاسم التجاري، الاسم العربي، الوصف، المادة الفعالة، التصنيف، الشركة المصنعة، الصور.

### 2. جدول مقارنة المخازن والأسعار للصنف (Core Multi-Vendor Feature)
* **Endpoint**: `GET /api/ProductPrices/available-by-product/{productId}`
* **Path Parameter**: `productId` (GUID).
* **البيانات المستلمة**: قائمة بكافة المخازن الموفرة للصنف حالياً:
  ```json
  [
    {
      "id": "price-guid-1",
      "inventoryUserId": "vendor-guid-1",
      "inventoryUser": {
        "bussinesName": "مخزن المتحدة للأدوية",
        "minOrder": 1000
      },
      "salesPrice": 50.0,
      "discountRate": 15.0,
      "effectiveSalesPrice": 42.5,
      "stockQuantity": 150,
      "maxQuantity": 20,
      "isFlashActive": false
    },
    {
      "id": "price-guid-2",
      "inventoryUserId": "vendor-guid-2",
      "inventoryUser": {
        "bussinesName": "شركة ابن سينا فارما",
        "minOrder": 2000
      },
      "salesPrice": 50.0,
      "discountRate": 18.0,
      "effectiveSalesPrice": 41.0,
      "stockQuantity": 40,
      "maxQuantity": 10,
      "isFlashActive": true
    }
  ]
  ```
* **تصميم واجهة الفرونت إند المقترح**:
  عرض بطاقة الدواء العلوية بالصور والوصف، وتحتها جدول تفاعلي:
  * اسم المخزن | نسبة الخصم | السعر الصافي | الستوك المتاح | اختيار الكمية | زر "إضافة للسلة".

---

## المرحلة 8: المفضلة والطلب السريع (Favorites & Wishlist)

الصيادلة يطلبون نفس النواقص أسبوعياً، لذلك توجد قائمة مفضلة سريعة:

### 1. إضافة أو إزالة صنف من المفضلة (Toggle Favorite)
* **Endpoint**: `POST /api/Products/toggle-Favorite?userId={userId}&productId={productId}&productPriceId={productPriceId}`
* **Auth**: مطلوب
* **السلوك**: ضغطة على زر القلب تبدل حالة المفضلة فوراً مع تحديث الأيقونة.

### 2. استعراض الأدوية المفضلة للصيدلية
* **Endpoint**: `GET /api/Products/get-myFav-products`
* **Auth**: مطلوب
* **استخدام الفرونت إند**: شاشة "أدويتي المفضلة" لإعادة الطلب بضغطة زر واحدة.

---

## المرحلة 9: سلة المشتريات متعددة المخازن (Cart Management)

### 1. جلب محتويات السلة
* **Endpoint**: `GET /api/Carts/{userId}`
* **Auth**: مطلوب
* **Path Parameter**: `userId` (GUID).
* **هيكل بنود السلة في الواجهة**:
  يجب تجميع الأصناف تحت اسم كل مخزن (`inventoryId`):
  * **مخزن أ**: صنف 1 + صنف 2 (المجموع: 800 ج.م / الحد الأدنى للمخزن: 1000 ج.م -> *تنبيه: متبقي 200 ج.م لاستيفاء الحد الأدنى*).
  * **مخزن ب**: صنف 3 (المجموع: 1500 ج.م -> *مستوفي للحد الأدنى*).

### 2. إضافة صنف للسلة (Add to Cart)
* **Endpoint**: `POST /api/Carts/AddToCart`
* **Auth**: مطلوب
* **Request Body**:
  ```json
  {
    "userId": "guid-user-id",
    "inventoryId": "guid-inventory-id",
    "productId": "guid-product-id",
    "quantity": 5
  }
  ```

### 3. تعديل كمية صنف في السلة
* **Endpoint**: `PUT /api/Carts/UpdateCartQuantity`
* **Auth**: مطلوب
* **Request Body**:
  ```json
  {
    "userId": "guid-user-id",
    "productId": "guid-product-id",
    "inventoryId": "guid-inventory-id",
    "quantity": 8
  }
  ```

### 4. حذف صنف من السلة
* **Endpoint**: `POST /api/Carts/RemoveFromCart`
* **Auth**: مطلوب
* **Request Body**:
  ```json
  {
    "userId": "guid-user-id",
    "productId": "guid-product-id"
  }
  ```

---

## المرحلة 10: مرحلة إتمام الطلب والدفع (Checkout & Order Placement)

قبل تأكيد الطلب، يقوم الصيدلي باختيار العنوان، موعد التوصيل، الكوبون، وطريقة الدفع:

### 1. اختيار عنوان التوصيل
* يتم جلب عناوين الصيدلية من `GET /api/Address/get-user-Addresses`.
* يتم اختيار العنوان المطلوب والحصول على `addresssId`.

### 2. اختيار نافذة مواعيد التسليم المتاحة (Delivery Time Slots)
* **Endpoint**: `GET /api/DeliveryTimeSlots?day={dayOfWeek}`
* **Query Parameter**: `day` (رقم اليوم من 0 إلى 6: 0 = الأحد، 1 = الإثنين... إلخ).
* **استخدام الفرونت إند**: إظهار أوقات الاستلام المناسبة للصيدلية (مثلاً: الفترة الصباحية من 10 ص إلى 2 م، أو الفترة المسائية من 6 م إلى 10 م).
* يتم الحصول على `deliveryTimeSlotId`.

### 3. فحص وتطبيق كود الخصم (Coupon)
* **فحص الكوبونات المتاحة للطلبية**:
  * `GET /api/Coupons/available?orderTotal={cartTotal}`
* **تطبيق كود خصم محدد**:
  * `POST /api/Coupons/apply`
  * **Request Body**:
    ```json
    {
      "code": "DRUGZA10",
      "amount": 2500.0
    }
    ```

### 4. فحص الرصيد والسقف الائتماني (للدفع الآجل)
* **Endpoint**: `GET /api/Balances/user/{userId}`
* **استخدام الفرونت إند**:
  * إذا اختار الصيدلي طريقة الدفع "آجل / ائتمان (Credit)": يتحقق الفرونت إند مما إذا كانت قيمة الطلب ضمن السقف الائتماني المتاح (`creditLimit - balance`).
  * إذا لم يكن كافياً، يتم إرشاده للدفع نقداً (Cash عند الاستلام).

### 5. تأكيد وإنشاء الطلب النهائي (Place Order)
* **Endpoint**: `POST /api/Orders`
* **Auth**: مطلوب (`Bearer Token`)
* **نوع المعاملات**: Query Parameters
* **المعاملات المطلوبة**:
  * `addresssId` (uuid): معرّف عنوان الصيدلية المختار *(لاحظ وجود 3 أحرف s في اسم المتغير بالباك إند: addresssId)*.
  * `deliveryDate` (int): خيار التسليم (مثل `1` أو `2` بحسب الـ DeliveryOption).
  * `deliveryTimeSlotId` (uuid): معرّف فترة التوصيل الزمنية.
  * `orderNote` (string): ملاحظات خاصة بالطلبية موجهة للمخزن ومندوب التوصيل.
  * `couponCode` (string): كود الخصم إن وجد (اختياري).
* **النتيجة**: يقوم الباك إند بتحويل عناصر السلة إلى طلب مسجل برقم طلب فريد (`orderNumber`)، وإفراغ عناصر السلة تلقائياً.

---

## المرحلة 11: إدارة وتتبع الطلبيات وحالاتها (Orders Management & Tracking)

### 1. استعراض قائمة طلبيات الصيدلية
* **Endpoint**: `GET /api/Orders/my-orders?status=`
* **Auth**: مطلوب
* **Query Parameter**: `status` (اختياري لفلترة الطلبيات: قيد التنفيذ، تم التوصيل، ملغاة).
* **أو جلب كافة الطلبات**: `GET /api/Orders/all-my-orders`

### 2. تفاصيل وتتبع حالة طلبية معينة (Order Tracking Timeline)
* **Endpoint**: `GET /api/Orders/details?orderNumber={orderNumber}`
* **أو بالمعرّف**: `GET /api/Orders/orders/{orderId}`
* **عرض شريط التتبع الحي في الفرونت إند (Order Status Stepper)**:
  1. **قيد الانتظار والمراجعة (Pending)**: بانتظار موافقة المخزن.
  2. **تمت الموافقة (Approved)**: تم اعتماد الطلبية.
  3. **قيد التجهيز بالمستودع (Preparing)**: عامل التحضير بالمخزن يقوم بجمع الأدوية.
  4. **تم إسناد المندوب والشحن (Shipped)**: الطلبية مع المندوب وفي طريقها للصيدلية.
  5. **تم التوصيل (Delivered)**: استلمت الصيدلية الطلبية.
  6. **مكتمل ومغلق (Completed)**: تم تسوية الدفع وصدور الفاتورة.

### 3. إلغاء الطلبية من قبل الصيدلية
* **Endpoint**: `PUT /api/Orders/cancel/{orderNumber}`
* **استخدام الفرونت إند**: زر "إلغاء الطلب" يظهر فقط عندما يكون الطلب في حالة الانتظار (Pending) ولم يبدأ تحضيره بعد.

---

## المرحلة 12: نظام مرتجعات الأدوية (Return Orders Workflow)

إذا استلمت الصيدلية صنفاً تالفاً، أو قريباً من تاريخ انتهاء الصلاحية، أو تم التوريد بالخطأ:

### 1. جلب قائمة أسباب الإرجاع المعتمدة
* **Endpoint**: `GET /api/ReturnReasons` أو `GET /api/returns/reasons`
* **الاستجابة**: قائمة بالأسباب مثل:
  * "قرب انتهاء الصلاحية (Near Expiry)"
  * "صنف تالف أو تسريب بالعبوة"
  * "صنف مغاير لما تم طلبه"
  * "زيادة في الكمية الموردة"

### 2. إنشاء طلب إرجاع أدوية (Create Return Request)
* **Endpoint**: `POST /api/returns`
* **Auth**: مطلوب
* **Request Body**:
  ```json
  {
    "orderNumber": "ORD-2026-9812",
    "items": [
      {
        "productId": "guid-product-id",
        "productPriceId": "guid-product-price-id",
        "quantityReturned": 3,
        "itemPrice": 45.0,
        "reasonId": "guid-reason-id",
        "otherReason": "ملاحظات إضافية عن سبب الإرجاع"
      }
    ]
  }
  ```

### 3. متابعة طلبات المرتجعات الخاصة بالصيدلية
* **Endpoint**: `GET /api/returns/pharmacy`
* **الاستجابة**: قائمة بطلبات الإرجاع وحالة كل طلب (بانتظار الموافقة، مقبولة وتمت التسوية، مرفوضة).

### 4. تفاصيل طلب مرتجع معين
* **Endpoint**: `GET /api/returns/{id}`

---

## المرحلة 13: المحفظة والرصيد والائتمان المالي (Wallet, Balances & Credit Limit)

### 1. استعراض رصيد الصيدلية وسقف الائتمان
* **Endpoint**: `GET /api/Balances/user/{userId}`
* **Auth**: مطلوب
* **البيانات المستلمة**:
  * `balance`: الرصيد المالي المتاح أو المستحق.
  * `creditLimit`: السقف الائتماني للدفع الآجل المعتمد للصيدلية من إدارة المنصة.
* **عرض الواجهة**: بطاقة رصيد الصيدلية توضح (الرصيد المتبقي - الائتمان المتاح - المبالغ المستحقة).

### 2. كشف حساب المعاملات المالية (Financial Transactions History)
* **Endpoint**: `GET /api/Balances/user-transactions/{userId}`
* **Auth**: مطلوب
* **استخدام الفرونت إند**: جدول كشف حساب تفصيلي للصيدلية يوضح كل حركة مالية:
  * سداد طلبية رقم كذا.
  * إضافة رصيد مرتجع لطلبية كذا.
  * إيداع بنكي أو تسوية نقدية.

---

## المرحلة 14: الفواتير الضريبية للطلبيات (Invoices)

### 1. استعراض كافة فواتير مشتريات الصيدلية
* **Endpoint**: `GET /api/Invoices/user/{userId}`
* **Auth**: مطلوب
* **استخدام الفرونت إند**: شاشة "الفواتير الضريبية" للبحث بالتواريخ وتحميل الفواتير لأغراض الحسابات والضرائب.

### 2. جلب فاتورة طلبية معينة
* **Endpoint**: `GET /api/Invoices/{orderNumber}` أو `GET /api/Invoices/order/{orderId}`
* **استخدام الفرونت إند**: زر "عرض الفاتورة" أو "طباعة الفاتورة" في صفحة تفاصيل الطلب.

---

## المرحلة 15: الإشعارات اللحظية وسياسات المتجر (Notifications & Policies)

### 1. جلب إشعارات الصيدلية
* **Endpoint**: `GET /api/Notifacations/{userId}`
* **استخدام الفرونت إند**: قائمة التنبيهات المنبثقة وجرس الإشعارات (تغيير حالة الطلب، عروض أسعار جديدة، موافقة على مرتجع).

### 2. سياسة الاستخدام والشروط والأحكام
* **Endpoint**: `GET /api/TermsAndConditions/get-terms?lang=ar`

### 3. سياسة الخصوصية
* **Endpoint**: `GET /api/Policy/get-policy?lang=ar`

### 4. سياسة الإرجاع والاستبدال الدوائي
* **Endpoint**: `GET /api/RefundPolicy/get-refund?lang=ar`

---

## 17. جدول ملخص لكافة الـ Endpoints والصلاحيات المطلوبة

| المرحلة / الموديول | المسار (Endpoint) | الطريقة (Method) | المصادقة (Auth) | الغرض الرئيسي في المتجر |
| :--- | :--- | :--- | :--- | :--- |
| **Lookup** | `/api/Countries/all-countries` | `GET` | Public | جلب قائمة الدول |
| **Lookup** | `/api/Cities/GetByCountryId/{countryId}` | `GET` | Public | جلب المدن بحسب الدولة |
| **Lookup** | `/api/Area/GetByCityId/{cityId}` | `GET` | Public | جلب المناطق بحسب المدينة |
| **Auth** | `/api/Users/register` | `POST` | Public | تسجيل حساب صيدلية جديد (FormData) |
| **Auth** | `/api/Users/verify-otp` | `POST` | Public | تأكيد وتفعيل الحساب بالـ OTP |
| **Auth** | `/api/Users/login` | `POST` | Public | تسجيل الدخول واستلام التوكن |
| **Auth** | `/api/Users/forget-password` | `POST` | Public | طلب كود استعادة كلمة المرور |
| **Auth** | `/api/Users/reset-password` | `POST` | Public | إعادة تعيين كلمة المرور الجديدة |
| **Auth** | `/api/Users/user/{userId}` | `GET` | Bearer | جلب ملف بيانات الصيدلية |
| **Address** | `/api/Address/get-user-Addresses` | `GET` | Bearer | استعراض عناوين الصيدلية |
| **Address** | `/api/Address/insert-address` | `POST` | Bearer | إضافة عنوان توصيل جديد |
| **Address** | `/api/Address/GetShippingFess/{addressId}` | `GET` | Bearer | استعلام تكلفة الشحن لعنوان |
| **Home** | `/api/Home/GetHome` | `GET` | Public | التغذية الرئيسية (بانرات، تصنيفات، مخازن) |
| **Home** | `/api/Banners` | `GET` | Public | جلب البانرات الإعلانية |
| **Flash Sale** | `/api/ProductPrices/flash-sale` | `GET` | Bearer | عروض الفلاش سيل النشطة مع العد التنازلي |
| **Catalog** | `/api/MainCategories` | `GET` | Public | جلب التصنيفات الرئيسية |
| **Catalog** | `/api/MainCategories/{id}/categories` | `GET` | Public | جلب التصنيفات الفرعية لقسم |
| **Catalog** | `/api/Brands/all-brands` | `GET` | Public | شركات الأدوية والمصنعين |
| **Search** | `/api/Products/search-product` | `GET` | Bearer | البحث الحي بالاسم والكود |
| **Generics** | `/api/ActiveIngerients` | `GET` | Bearer | جلب المواد الفعالة وإيجاد البدائل |
| **Product** | `/api/Products/{id}` | `GET` | Bearer | تفاصيل الدواء الأساسية |
| **Pricing** | `/api/ProductPrices/available-by-product/{productId}` | `GET` | Bearer | جدول مقارنة أسعار وخصومات المخازن للصنف |
| **Favorites** | `/api/Products/toggle-Favorite` | `POST` | Bearer | إضافة/إزالة صنف من المفضلة |
| **Favorites** | `/api/Products/get-myFav-products` | `GET` | Bearer | جلب قائمة الأدوية المفضلة |
| **Cart** | `/api/Carts/{userId}` | `GET` | Bearer | استعراض سلة المشتريات |
| **Cart** | `/api/Carts/AddToCart` | `POST` | Bearer | إضافة صنف لسلة مخزن محدد |
| **Cart** | `/api/Carts/UpdateCartQuantity` | `PUT` | Bearer | تحديث كمية صنف في السلة |
| **Cart** | `/api/Carts/RemoveFromCart` | `POST` | Bearer | حذف صنف من السلة |
| **Checkout** | `/api/DeliveryTimeSlots` | `GET` | Bearer | جلب نوافذ مواعيد التوصيل باليوم |
| **Checkout** | `/api/Coupons/apply` | `POST` | Bearer | تطبيق كود الخصم |
| **Checkout** | `/api/Orders` | `POST` | Bearer | إنشاء وتأكيد الطلب النهائي |
| **Orders** | `/api/Orders/my-orders` | `GET` | Bearer | قائمة طلبيات الصيدلية |
| **Orders** | `/api/Orders/details` | `GET` | Bearer | تفاصيل وتتبع مراحل الطلبية |
| **Orders** | `/api/Orders/cancel/{orderNumber}` | `PUT` | Bearer | إلغاء طلبية قيد الانتظار |
| **Returns** | `/api/ReturnReasons` | `GET` | Bearer | قائمة أسباب إرجاع الأدوية |
| **Returns** | `/api/returns` | `POST` | Bearer | إنشاء طلب إرجاع أدوية |
| **Returns** | `/api/returns/pharmacy` | `GET` | Bearer | متابعة طلبات إرجاع الصيدلية |
| **Wallet** | `/api/Balances/user/{userId}` | `GET` | Bearer | استعلام رصيد الصيدلية وسقف الائتمان |
| **Wallet** | `/api/Balances/user-transactions/{userId}` | `GET` | Bearer | سجل المعاملات المالية وكشف الحساب |
| **Invoices** | `/api/Invoices/user/{userId}` | `GET` | Bearer | استعراض الفواتير الضريبية |
| **Invoices** | `/api/Invoices/{orderNumber}` | `GET` | Bearer | جلب فاتورة طلبية محددة |
| **Notifications**| `/api/Notifacations/{userId}` | `GET` | Bearer | إشعارات الصيدلية |
| **Policies** | `/api/TermsAndConditions/get-terms` | `GET` | Public | الشروط والأحكام |
| **Policies** | `/api/RefundPolicy/get-refund` | `GET` | Public | سياسة الإرجاع |

---

## 18. تنبيهات وأخطاء شائعة في الباك إند (Crucial Backend Quirks & Caveats)

1. **انتبه لحرف الـ s الزائد في باراميتر العنوان (`addresssId`)**:
   في الـ Endpoint الخاص بإنشاء الطلب `POST /api/Orders`، تم تسمية المتغير في الباك إند باسم `addresssId` بثلاثة أحرف `s` وليس `addressId`. احرص على إرساله بنفس الاسم تماماً في الـ Query Parameters:
   ```text
   POST /api/Orders?addresssId={guid}&deliveryDate=1&deliveryTimeSlotId={guid}&orderNote=...
   ```
2. **تسجيل الحساب يستخدم `multipart/form-data`**:
   لا ترسل طلب `POST /api/Users/register` كـ JSON، بل استخدم كائن `FormData` لأن الحساب يتضمن رفع صورة السجل التجاري/الملف الشخصي (`ProfileImage`).
3. **تخزين وتمرير الـ JWT Token**:
   احرص على إنشاء Axios Instance مع Interceptor يضع الترويسة تلقائياً:
   ```javascript
   apiClient.interceptors.request.use((config) => {
     const token = localStorage.getItem('drugza_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```
4. **تجميع بنود السلة بحسب المخزن (`Cart Grouping by Inventory`)**:
   بما أن هذا المتجر B2B، فإن كل منتج يضاف للسلة من مخزن معين (`inventoryId`). قم دائماً بتجميع بنود السلة في الواجهة لكل مخزن في صندوق مستقل وافحص الحد الأدنى للطلب (`minOrder`) لكل مخزن على حدة لضمان تجربة مستخدم واضحة وخالية من اللبس.
5. **استخراج البدائل والمثائل الدوائية**:
   عند فتح أي منتج، استفد دائماً من حقل `activeIngerdientId` للبحث عن المنتجات البديلة وعرضها في أسفل صفحة المنتج، فهذه الميزة هي الأهم والأكثر استخداماً من قبل الصيادلة.

---
*بهذا الدليل تملك كل تفصيلة تقنية تحتاجها لبناء الفرونت إند من الألف إلى الياء بكل دقة ويسر.*
