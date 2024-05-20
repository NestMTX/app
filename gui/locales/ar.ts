export default {
  fields: {
    generic: 'هذا الحقل',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
  },
  actions: {
    login: 'تسجيل الدخول',
  },
  validation: {
    bad: 'القيمة ليست صالحة {label}',
    notAFile: 'الرجاء تحديد {label}',
    tooManyFiles: 'الرجاء تحديد ملف واحد فقط',
    fileTooLarge: 'الملف الذي حددته كبير جدًا',
    invalidFileType: 'الملف الذي حددته ليس من نوع الملفات المقبولة',
    fileTypeNotAccepted: 'الملف الذي حددته ليس من نوع الملفات المقبولة',
    invalid: 'الرجاء إدخال {label}',
    required: 'الرجاء إدخال {label}',
    requiredSelection: 'الرجاء اختيار {label}',
    requiredUpload: 'الرجاء تحديد {label}',
    email: 'يرجى إدخال عنوان بريد إلكتروني صالح',
    min: 'يجب أن يبلغ طول {label} {min} من الأحرف على الأقل',
    characters: 'يحتوي {label} الذي قمت بإدخاله على أحرف غير صالحة',
    invalidRsaId: 'الرجاء إدخال {label} صالحًا',
    country: 'يرجى اختيار بلد إقامتك',
    valid: 'الرجاء إدخال {label} صالحًا',
    alternatives: {
      all: 'القيمة لم تطابق كافة المعايير.',
      any: 'لم يتم العثور على بديل للاختبار مقابل الإدخال بسبب معايير المحاولة.',
      match: 'لم يطابق أي بديل الإدخال بسبب قواعد المطابقة المحددة لواحد على الأقل من البدائل.',
      one: 'تطابقت القيمة مع أكثر من مخطط بديل.',
      types: 'الإدخال المقدم لم يتطابق مع أي من الأنواع المسموح بها.',
    },
    any: {
      custom: 'الرجاء إدخال {label} صالحًا',
      default: 'يرجى الاتصال بالدعم',
      failover: 'يرجى الاتصال بالدعم',
      invalid: 'تطابقت القيمة مع قيمة مدرجة في القيم غير الصالحة.',
      only: 'تم السماح ببعض القيم فقط، ولم يتطابق الإدخال مع أي منها.',
      ref: 'الإدخال غير صالح.',
      required: 'القيمة المطلوبة لم تكن موجودة.',
      unknown: 'كانت القيمة موجودة بينما لم تكن متوقعة.',
    },
    boolean: {
      base: '{label} مطلوب',
      accepted: 'يجب عليك قبول {label}',
    },
    phone: {
      invalid: 'الرجاء إدخال {label} صالحًا',
      mobile: 'الرجاء إدخال رقم جوال صحيح',
    },
    string: {
      alphanum: 'يحتوي {label} على أحرف ليست أبجدية رقمية.',
      alpha: 'يحتوي {label} على أحرف غير أبجدية.',
      base: '{label} مطلوب',
      country: 'الرجاء تحديد {label} صالحًا',
      email: 'يرجى إدخال البريد الإلكتروني الصحيح.',
      empty: 'لا يمكن أن يكون {label} فارغًا.',
      length: '{label} ليس بالطول المطلوب.',
      max: '{label} أطول من الحد الأقصى للطول المسموح به.',
      min: '{label} أقصر من الحد الأدنى المسموح به للطول.',
      pattern: {
        base: 'يحتوي {label} على أحرف غير صالحة.',
        name: 'يحتوي {label} على أحرف غير صالحة.',
        invert: {
          base: 'يحتوي {label} على أحرف غير صالحة.',
          name: 'يحتوي {label} على أحرف غير صالحة.',
        },
      },
    },
  },
  countries: {
    ad: 'أندورا',
    ae: 'الإمارات العربية المتحدة',
    af: 'أفغانستان',
    ag: 'أنتيغوا وبربودا',
    ai: 'أنغيلا',
    al: 'ألبانيا',
    am: 'أرمينيا',
    ao: 'أنغولا',
    aq: 'القارة القطبية الجنوبية',
    ar: 'الأرجنتين',
    as: 'ساموا الأمريكية',
    at: 'النمسا',
    au: 'أستراليا',
    aw: 'أروبا',
    ax: 'جزر آلاند',
    az: 'أذربيجان',
    ba: 'البوسنة والهرسك',
    bb: 'بربادوس',
    bd: 'بنغلاديش',
    be: 'بلجيكا',
    bf: 'بوركينا فاسو',
    bg: 'بلغاريا',
    bh: 'البحرين',
    bi: 'بوروندي',
    bj: 'بنين',
    bl: 'سانت بارتيليمي',
    bm: 'برمودا',
    bn: 'بروناي دار السلام',
    bo: 'بوليفيا، دولة متعددة القوميات',
    bq: 'بونير، سينت أوستاتيوس وسابا',
    br: 'البرازيل',
    bs: 'جزر البهاما',
    bt: 'بوتان',
    bv: 'جزيرة بوفيه',
    bw: 'بوتسوانا',
    by: 'بيلاروسيا',
    bz: 'بليز',
    ca: 'كندا',
    cc: 'جزر كوكوس (كيلينغ).',
    cd: 'الكونغو، جمهورية الكونغو الديمقراطية',
    cf: 'جمهورية افريقيا الوسطى',
    cg: 'الكونغو',
    ch: 'سويسرا',
    ci: 'ساحل العاج',
    ck: 'جزر كوك',
    cl: 'شيلي',
    cm: 'الكاميرون',
    cn: 'الصين',
    co: 'كولومبيا',
    cr: 'كوستا ريكا',
    cu: 'كوبا',
    cv: 'الرأس الأخضر',
    cw: 'كوراساو',
    cx: 'جزيرة عيد الميلاد',
    cy: 'قبرص',
    cz: 'التشيك',
    de: 'ألمانيا',
    dj: 'جيبوتي',
    dk: 'الدنمارك',
    dm: 'دومينيكا',
    do: 'جمهورية الدومينيكان',
    dz: 'الجزائر',
    ec: 'الاكوادور',
    ee: 'إستونيا',
    eg: 'مصر',
    eh: 'الصحراء الغربية',
    er: 'إريتريا',
    es: 'إسبانيا',
    et: 'أثيوبيا',
    fi: 'فنلندا',
    fj: 'فيجي',
    fk: 'جزر فوكلاند (مالفيناس)',
    fm: 'ولايات ميكرونيزيا الموحدة',
    fo: 'جزر فاروس',
    fr: 'فرنسا',
    ga: 'الجابون',
    gb: 'المملكة المتحدة',
    gd: 'غرينادا',
    ge: 'جورجيا',
    gf: 'غيانا الفرنسية',
    gg: 'غيرنسي',
    gh: 'غانا',
    gi: 'جبل طارق',
    gl: 'الأرض الخضراء',
    gm: 'غامبيا',
    gn: 'غينيا',
    gp: 'جوادلوب',
    gq: 'غينيا الإستوائية',
    gr: 'اليونان',
    gs: 'جورجيا الجنوبية وجزر ساندويتش الجنوبية',
    gt: 'غواتيمالا',
    gu: 'غوام',
    gw: 'غينيا بيساو',
    gy: 'غيانا',
    hk: 'هونج كونج',
    hm: 'قلب الجزيرة وجزر ماكدونالز',
    hn: 'هندوراس',
    hr: 'كرواتيا',
    ht: 'هايتي',
    hu: 'هنغاريا',
    id: 'إندونيسيا',
    ie: 'أيرلندا',
    il: 'إسرائيل',
    im: 'جزيرة آيل أوف مان',
    in: 'الهند',
    io: 'إقليم المحيط البريطاني الهندي',
    iq: 'العراق',
    ir: 'إيران، الجمهورية الإسلامية',
    is: 'أيسلندا',
    it: 'إيطاليا',
    je: 'جيرسي',
    jm: 'جامايكا',
    jo: 'الأردن',
    jp: 'اليابان',
    ke: 'كينيا',
    kg: 'قيرغيزستان',
    kh: 'كمبوديا',
    ki: 'كيريباتي',
    km: 'جزر القمر',
    kn: 'سانت كيتس ونيفيس',
    kp: 'كوريا، الجمهورية الشعبية الديمقراطية',
    kr: 'جمهورية كوريا',
    kw: 'الكويت',
    ky: 'جزر كايمان',
    kz: 'كازاخستان',
    la: 'جمهورية لاو الديمقراطية الشعبية',
    lb: 'لبنان',
    lc: 'القديسة لوسيا',
    li: 'ليختنشتاين',
    lk: 'سيريلانكا',
    lr: 'ليبيريا',
    ls: 'ليسوتو',
    lt: 'ليتوانيا',
    lu: 'لوكسمبورغ',
    lv: 'لاتفيا',
    ly: 'ليبيا',
    ma: 'المغرب',
    mc: 'موناكو',
    md: 'جمهورية مولدوفا',
    me: 'الجبل الأسود',
    mf: 'سانت مارتن (الجزء الفرنسي)',
    mg: 'مدغشقر',
    mh: 'جزر مارشال',
    mk: 'مقدونيا الشمالية',
    ml: 'كان لديهم',
    mm: 'ميانمار',
    mn: 'منغوليا',
    mo: 'ماكاو',
    mp: 'جزر مريانا الشمالية',
    mq: 'مارتينيك',
    mr: 'موريتانيا',
    ms: 'مونتسيرات',
    mt: 'مالطا',
    mu: 'موريشيوس',
    mv: 'جزر المالديف',
    mw: 'ملاوي',
    mx: 'المكسيك',
    my: 'ماليزيا',
    mz: 'موزمبيق',
    na: 'ناميبيا',
    nc: 'كاليدونيا الجديدة',
    ne: 'النيجر',
    nf: 'جزيرة نورفولك',
    ng: 'نيجيريا',
    ni: 'نيكاراغوا',
    nl: 'هولندا',
    no: 'النرويج',
    np: 'نيبال',
    nr: 'ناورو',
    nu: 'نيوي',
    nz: 'نيوزيلندا',
    om: 'خاصتي',
    pa: 'بنما',
    pe: 'بيرو',
    pf: 'بولينيزيا الفرنسية',
    pg: 'بابوا غينيا الجديدة',
    ph: 'فيلبيني',
    pk: 'باكستان',
    pl: 'بولندا',
    pm: 'سانت بيير وميكلون',
    pn: 'بيتكيرن',
    pr: 'بورتوريكو',
    ps: 'فلسطين، دولة',
    pt: 'البرتغال',
    pw: 'بالاو',
    py: 'باراجواي',
    qa: 'دولة قطر',
    re: 'مقابلة',
    ro: 'رومانيا',
    rs: 'صربيا',
    ru: 'الاتحاد الروسي',
    rw: 'رواندا',
    sa: 'المملكة العربية السعودية',
    sb: 'جزر سليمان',
    sc: 'سيشيل',
    sd: 'السودان',
    se: 'السويد',
    sg: 'سنغافورة',
    sh: 'سانت هيلانة وأسنشن وتريستان دا كونها',
    si: 'سلوفينيا',
    sj: 'سفالبارد وجان ماين',
    sk: 'سلوفاكيا',
    sl: 'سيرا ليون',
    sm: 'سان مارينو',
    sn: 'السنغال',
    so: 'الصومال',
    sr: 'سورينام',
    ss: 'جنوب السودان',
    st: 'سان تومي وبرينسيبي',
    sv: 'السلفادور',
    sx: 'سينت مارتن (الجزء الهولندي)',
    sy: 'الجمهورية العربية السورية',
    sz: 'في سوات',
    tc: 'جزر تركس وكايكوس',
    td: 'تشاد',
    tf: 'المناطق الجنوبية لفرنسا',
    tg: 'توجو',
    th: 'تايلاند',
    tj: 'طاجيكستان',
    tk: 'توكيلاو',
    tl: 'قرأ تيمور',
    tm: 'تركمانستان',
    tn: 'تونس',
    to: 'وصل',
    tr: 'ديك رومى',
    tt: 'ترينداد وتوباغو',
    tv: 'توفالو',
    tw: 'تايوان',
    tz: 'تنزانيا، جمهورية المتحدة',
    ua: 'أوكرانيا',
    ug: 'أوغندا',
    um: 'جزر الولايات المتحدة البعيدة الصغرى',
    us: 'الولايات المتحدة',
    uy: 'أوروغواي',
    uz: 'أوزبكستان',
    va: 'الكرسي الرسولي',
    vc: 'سانت فنسنت وجزر غرينادين',
    ve: 'فنزويلا، جمهورية البوليفارية',
    vg: 'جزر العذراء البريطانية',
    vi: 'جزر فيرجن الأمريكية',
    vn: 'فيتنام',
    vu: 'فانواتو',
    wf: 'واليس وفوتونا',
    ws: 'ساموا',
    xx: 'مجهول',
    xk: 'كوسوفو',
    ye: 'اليمن',
    yt: 'مايوت',
    za: 'جنوب أفريقيا',
    zm: 'زامبيا',
    zw: 'زيمبابوي',
  },
  models: {
    country: {
      single: 'بلد',
      plural: 'بلدان',
    },
  },
  errors: {
    login: {
      title: 'فشل تسجيل الدخول',
    },
    auth: {
      create: {
        loggedIn: 'انت بالفعل داخل',
      },
    },
  },
  dialogs: {
    systemInfo: {
      title: 'معلومات النظام',
      cards: {
        app: 'معلومات التطبيق',
        cpu: 'وحدة المعالجة المركزية',
        info: 'معلومات المضيف',
        logs: 'السجلات',
        memory: 'ذاكرة',
        network: 'شبكة',
        uptime: 'مدة التشغيل',
      },
    },
  },
  $vuetify: {
    badge: 'شارة',
    open: 'يفتح',
    close: 'يغلق',
    dismiss: 'رفض',
    confirmEdit: {
      ok: 'نعم',
      cancel: 'يلغي',
    },
    dataIterator: {
      noResultsText: 'لم يتم العثور على سجلات مطابقة',
      loadingText: 'جارٍ تحميل العناصر...',
    },
    dataTable: {
      itemsPerPageText: 'صفوف لكل صفحة:',
      ariaLabel: {
        sortDescending: 'مرتبة تنازليا.',
        sortAscending: 'مرتبة تصاعديا.',
        sortNone: 'لم يتم فرزها.',
        activateNone: 'قم بالتنشيط لإزالة الفرز.',
        activateDescending: 'تفعيل لفرز تنازلي.',
        activateAscending: 'تفعيل لفرز تصاعدي.',
      },
      sortBy: 'ترتيب حسب',
    },
    dataFooter: {
      itemsPerPageText: 'مواد لكل صفحة:',
      itemsPerPageAll: 'الجميع',
      nextPage: 'الصفحة التالية',
      prevPage: 'الصفحة السابقة',
      firstPage: 'الصفحة الأولى',
      lastPage: 'آخر صفحة',
      pageText: '{0}-{1} من {2}',
    },
    dateRangeInput: {
      divider: 'ل',
    },
    datePicker: {
      itemsSelected: 'تم تحديد {0}.',
      range: {
        title: 'حدد التواريخ',
        header: 'أدخل التواريخ',
      },
      title: 'حدد تاريخ',
      header: 'أدخل التاريخ',
      input: {
        placeholder: 'أدخل التاريخ',
      },
    },
    noDataText: 'لا تتوافر بيانات',
    carousel: {
      prev: 'المرئية السابقة',
      next: 'البصرية القادمة',
      ariaLabel: {
        delimiter: 'الشريحة الدائرية {0} من {1}',
      },
    },
    calendar: {
      moreEvents: '{0} المزيد',
      today: 'اليوم',
    },
    input: {
      clear: 'مسح {0}',
      prependAction: '{0} إجراء مُسبق',
      appendAction: '{0} الإجراء الملحق',
      otp: 'الرجاء إدخال حرف OTP {0}',
    },
    fileInput: {
      counter: '{0} ملفات',
      counterSize: '{0} ملف ({1} إجمالاً)',
    },
    timePicker: {
      am: 'أكون',
      pm: 'مساءً',
      title: 'حدد الوقت',
    },
    pagination: {
      ariaLabel: {
        root: 'التنقل بين الصفحات',
        next: 'الصفحة التالية',
        previous: 'الصفحة السابقة',
        page: 'انتقل إلى الصفحة {0}',
        currentPage: 'الصفحة {0}، الصفحة الحالية',
        first: 'الصفحة الأولى',
        last: 'آخر صفحة',
      },
    },
    stepper: {
      next: 'التالي',
      prev: 'سابق',
    },
    rating: {
      ariaLabel: {
        item: 'التقييم {0} من {1}',
      },
    },
    loading: 'تحميل...',
    infiniteScroll: {
      loadMore: 'تحميل المزيد',
      empty: 'لا أكثر',
    },
  },
  logs: {
    levels: {
      trace: 'يتعقب',
      debug: 'تصحيح',
      info: 'معلومات',
      warn: 'تحذير',
      error: 'خطأ',
      fatal: 'مميت',
      silent: 'صامتة',
    },
  },
  pages: {
    undefined: {
      nav: 'صفحة غير معروفة',
      title: 'نيستMTX',
      description: 'لوحة تحكم نيست إم تي إكس',
      header: 'صفحة غير معروفة',
      subtitle: 'الصفحة التي تبحث عنها غير موجودة.',
    },
    index: {
      nav: 'بيت',
      title: 'نيستMTX',
      description: 'لوحة تحكم نيست إم تي إكس',
      header: 'لوحة التحكم',
      subtitle: 'عرض وإدارة مثيل NestMTX الخاص بك',
    },
    credentials: {
      nav: 'أوراق اعتماد',
      title: 'بيانات الاعتماد - NestMTX',
      description: 'إدارة بيانات اعتماد NestMTX',
      header: 'أوراق اعتماد',
      subtitle: 'إدارة بيانات اعتماد Google Cloud Platform وGoogle Device Access Console',
    },
  },
}
