export type QuestionType = "single" | "multiple";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: number;
  lecture: number;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswers: number[];
  difficulty: Difficulty;
  points: number;
}

// 30 easy×3 + 50 medium×5 + 20 hard×8 = 90+250+160 = 500
export const questions: Question[] = [

  // ════════════════════════════════════════════════════════
  // MÜHAZIRƏ 1 — QA Əsasları (14 sual)
  // ════════════════════════════════════════════════════════
  {
    id: 1, lecture: 1,
    text: "Testing nədir?",
    type: "single",
    options: [
      "Proqramın faktiki davranışının gözlənən davranışla uzlaşıb-uzlaşmamasını yoxlama prosesi",
      "Proqram kodunun yazılması prosesi",
      "Proqramın istifadəçilərə çatdırılması prosesi",
      "Xətaların avtomatik düzəldilməsi prosesi",
    ],
    correctAnswers: [0], difficulty: "easy", points: 3,
  },
  {
    id: 2, lecture: 1,
    text: "QA (Quality Assurance) nəyi ifadə edir?",
    type: "single",
    options: [
      "Yalnız hazır məhsulda xətaların axtarılması",
      "Məhsulun keyfiyyətini proses boyu izləmək və yaxşılaşdırmaq məqsədi daşıyan proses",
      "Proqramın son istifadəçiyə çatdırılması",
      "Kodun yalnız sona yaxın test edilməsi",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 3, lecture: 1,
    text: "NASA Mars Climate Orbiter (1999) hadisəsinin baş verməsinin əsas səbəbi nə idi?",
    type: "single",
    options: [
      "Server performans problemi",
      "İki komanda fərqli ölçü sistemlərindən istifadə etdi: biri imperial, digəri metrik",
      "Proqramçı kodu yanlış yazdı",
      "Verilənlər bazası xətası",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 4, lecture: 1,
    text: "Knight Capital Group (2012) hadisəsindən əsas dərs hansıdır?",
    type: "single",
    options: [
      "Test etmək vaxt itkisidir",
      "Yalnız manual test yetərlidir",
      "Köhnə modulların istifadəsizliyinə baxmayaraq aktiv qalması böyük maliyyə fəlakətinə səbəb ola bilər",
      "Avtomatlaşdırma həmişə güvənlidir",
    ],
    correctAnswers: [2], difficulty: "medium", points: 5,
  },
  {
    id: 5, lecture: 1,
    text: "Toyota geri çağırma hadisəsindəki 'spaghetti code' nə deməkdir?",
    type: "single",
    options: [
      "Çox sürətli işləyən kod",
      "Nizamsız və təkrarlanan kod strukturu",
      "İtalyan proqramçıların yazdığı kod",
      "Çox qısa yazılmış kod",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 6, lecture: 1,
    text: "Testin məqsədləri hansılardır? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Səhv (bug) tapmaq",
      "Keyfiyyətin qiymətləndirilməsi",
      "Risklərin azaldılması",
      "Standartlara uyğunluğun yoxlanması",
      "Proqramın 100% xətasız olduğunu sübut etmək",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "medium", points: 5,
  },
  {
    id: 7, lecture: 1,
    text: "QA-nın əsas vəzifəsi nədir?",
    type: "single",
    options: [
      "Yalnız hazır məhsulda bug tapmaq",
      "Kod yazmaq",
      "Tələblərin düzgün yazıldığını yoxlamaq, prosesləri optimallaşdırmaq və keyfiyyəti proses boyu təmin etmək",
      "Layihəni müştəriyə təqdim etmək",
    ],
    correctAnswers: [2], difficulty: "easy", points: 3,
  },
  {
    id: 8, lecture: 1,
    text: "Tester kimdir?",
    type: "single",
    options: [
      "Proqram kodunu yazan şəxs",
      "Proqram təminatının real istifadəçi ssenariləri üzrə testlərini həyata keçirən şəxs",
      "Layihə meneceri",
      "Müştəri nümayəndəsi",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 9, lecture: 1,
    text: "Risk düsturu necədir?",
    type: "single",
    options: [
      "Risk = Bug sayı × Test sayı",
      "Risk = Impact × Likelihood",
      "Risk = Vaxt × Xərc",
      "Risk = Komanda sayı × Modul sayı",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 10, lecture: 1,
    text: "İlk prioritet test edilməli olan funksiyalar hansılardır?",
    type: "multiple",
    options: [
      "Login",
      "Payment (ödəniş)",
      "Data save",
      "Dizayn rəngləri",
      "Security",
    ],
    correctAnswers: [0, 1, 2, 4], difficulty: "medium", points: 5,
  },
  {
    id: 11, lecture: 1,
    text: "QA yalnız test mərhələsindəmi iştirak edir?",
    type: "single",
    options: [
      "Bəli, yalnız test mərhələsində",
      "Xeyr, məhsulun planlaşdırılmasından buraxılışına qədər hər mərhələdə",
      "Yalnız deployment zamanı",
      "Yalnız müştəriyə təqdimetmə zamanı",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 12, lecture: 1,
    text: "Real proqram xətaları hansı nəticələrə səbəb ola bilər? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Maddi itkilər",
      "Hüquqi problemlər",
      "İnsan həyatına təhlükə",
      "Etibar itkisi",
      "Daha sürətli proqram inkişafı",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "hard", points: 8,
  },
  {
    id: 13, lecture: 1,
    text: "QA-nın məqsədi yalnız bug tapmaqdırmı?",
    type: "single",
    options: [
      "Bəli, yalnız bug tapmaq",
      "Xeyr, sistemin düzgün şəkildə hazırlanmasına zəmanət verməkdir",
      "Bəli, ancaq performans testləri aparır",
      "Xeyr, yalnız müştəri ilə ünsiyyət saxlayır",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 14, lecture: 1,
    text: "QA mütəxəssisinin Toyota hadisəsindən çıxarmalı olduğu ən vacib dərs nədir?",
    type: "single",
    options: [
      "Kod mürəkkəb olmalıdır",
      "Test yalnız son mərhələdə aparılmalıdır",
      "Tester və QA mütəxəssisi riskləri öncədən görməli və önləməlidir",
      "Manuel testlər yetərlidir",
    ],
    correctAnswers: [2], difficulty: "hard", points: 8,
  },

  // ════════════════════════════════════════════════════════
  // MÜHAZIRƏ 2 — QA, QC, Testing; Bug/Defect; ISTQB Prinsipləri (14 sual)
  // ════════════════════════════════════════════════════════
  {
    id: 15, lecture: 2,
    text: "QA ilə QC arasındakı əsas fərq nədir?",
    type: "single",
    options: [
      "QA reaktiv, QC proaktiv yanaşmadır",
      "QA prosesə fokuslanır (proaktiv), QC hazır məhsulu yoxlayır (reaktiv)",
      "QA yalnız inkişaf mərhələsindədir, QC yalnız test mərhələsindədir",
      "Onlar eyni şeydir, sadəcə fərqli adlardır",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 16, lecture: 2,
    text: "Testing nəyin alt hissəsidir?",
    type: "single",
    options: [
      "QA-nın",
      "QC-nin",
      "SDLC-nin",
      "Agile-ın",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 17, lecture: 2,
    text: "Bug, Defect, Error, Failure terminlərinin düzgün izahı hansıdır?",
    type: "single",
    options: [
      "Hamısı eyni mənanı daşıyır",
      "Error – insan səhvi, Defect – kodda xəta, Failure – sistemin gözlənilməz davranışı",
      "Bug – texniki termin, Defect – müştəri termini",
      "Failure yalnız server çökmələridir",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },
  {
    id: 18, lecture: 2,
    text: "ISTQB-yə görə testlər nə sübut edə bilər?",
    type: "single",
    options: [
      "Proqramın 100% xətasız olduğunu",
      "Defektlərin mövcudluğunu, amma onların yoxluğunu sübut edə bilməz",
      "Bütün xətaların tapıldığını",
      "Proqramın ömürlük işləyəcəyini",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 19, lecture: 2,
    text: "ISTQB-nin '7 Test Prinsipi'ndən biri olan 'Pesticide Paradox' nəyi ifadə edir?",
    type: "single",
    options: [
      "Test nə qədər çox aparılsa, bir o qədər yaxşıdır",
      "Eyni testlər dəfələrlə təkrarlanırsa, yeni bug tapmaq çətinləşir — test ssenariləri yenilənməlidir",
      "Bütün testlər avtomatlaşdırılmalıdır",
      "Test yalnız son mərhələdə aparılmalıdır",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 20, lecture: 2,
    text: "Static Testing nədir?",
    type: "single",
    options: [
      "Proqramı işə salıb test etmək",
      "Proqramı işə salmadan kod, sənəd və ya tələblərin yoxlanması",
      "Yalnız istifadəçi interfeysi testləri",
      "Yük testləri",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 21, lecture: 2,
    text: "Dynamic Testing nədir?",
    type: "single",
    options: [
      "Proqramı işə salmadan sənədlərin yoxlanması",
      "Proqramı işə salıb real giriş məlumatları ilə faktiki davranışın yoxlanması",
      "Yalnız kod reviewdur",
      "Layihə sənədlərinin yoxlanması",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 22, lecture: 2,
    text: "QC fəaliyyətinin nümunəsi hansıdır?",
    type: "single",
    options: [
      "Kodlaşdırma standartlarının müəyyən edilməsi",
      "Test strategiyasının hazırlanması",
      "Hazır mobil tətbiqdə 'login' funksiyasının test edilib parol xətasının tapılması",
      "Layihə üçün audit keçirilməsi",
    ],
    correctAnswers: [2], difficulty: "medium", points: 5,
  },
  {
    id: 23, lecture: 2,
    text: "'Testlər kontekstdən asılıdır' prinsipi nəyi bildirir?",
    type: "single",
    options: [
      "Bütün layihələrdə eyni test strategiyası tətbiq edilməlidir",
      "Hər layihənin özünəməxsus xüsusiyyətləri var və test yanaşması ona uyğun seçilməlidir",
      "Test həmişə avtomatlaşdırılmalıdır",
      "Yalnız böyük layihələrdə test lazımdır",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 24, lecture: 2,
    text: "QA fəaliyyətlərinə aşağıdakılardan hansılar daxildir? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Proseslərin və standartların müəyyən edilməsi",
      "Audit və təftişlər",
      "Davamlı inkişaf təşəbbüsləri",
      "Kod yazmaq",
      "Təlimatlar və sənədlərin hazırlanması",
    ],
    correctAnswers: [0, 1, 2, 4], difficulty: "medium", points: 5,
  },
  {
    id: 25, lecture: 2,
    text: "'Erkən test' prinsipinə görə test nə zaman başlamalıdır?",
    type: "single",
    options: [
      "Yalnız proqram tam hazır olduqda",
      "Deployment mərhələsindən əvvəl",
      "Mümkün qədər erkən — tələblər mərhələsindən",
      "Yalnız sistem testi mərhələsində",
    ],
    correctAnswers: [2], difficulty: "easy", points: 3,
  },
  {
    id: 26, lecture: 2,
    text: "'Tam test mümkün deyil' prinsipi nəyi ifadə edir?",
    type: "single",
    options: [
      "Test etməyə ehtiyac yoxdur",
      "Bütün mümkün giriş kombinasiyalarını, yollarını test etmək praktiki cəhətdən qeyri-mümkündür",
      "Yalnız avtomatlaşdırılmış testlər yetərlidir",
      "Test yalnız bəzi modullar üçün lazımdır",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 27, lecture: 2,
    text: "QA proaktiv yanaşma nümunəsi hansıdır?",
    type: "single",
    options: [
      "Hazır tətbiqdə bug tapmaq",
      "Yeni layihə başlamadan əvvəl kodlaşdırma standartları, test strategiyası, sənədləşmə qaydaları təyin etmək",
      "İstifadəçi şikayətlərinə cavab vermək",
      "Deployment sonrası xətaları düzəltmək",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },
  {
    id: 28, lecture: 2,
    text: "'Defect Clustering' (xəta qruplaşması) prinsipi nəyi ifadə edir?",
    type: "single",
    options: [
      "Bütün modullar eyni sayda xəta ehtiva edir",
      "Xətaların böyük əksəriyyəti az sayda modul və ya funksionalda cəmləşir",
      "Xətalar bütün sistem boyu bərabər paylanır",
      "Xətalar yalnız son versiyada tapılır",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },

  // ════════════════════════════════════════════════════════
  // MÜHAZIRƏ 3 — SDLC, Agile, Scrum (15 sual)
  // ════════════════════════════════════════════════════════
  {
    id: 29, lecture: 3,
    text: "SDLC nədir?",
    type: "single",
    options: [
      "Yalnız test prosesini əhatə edən çərçivə",
      "Proqram təminatının ilk ideyadan buraxılışına qədər bütün mərhələlərini təşkil edən strukturlaşdırılmış proses",
      "Avtomatlaşdırılmış test çərçivəsi",
      "Müştəri ilə ünsiyyət protokolu",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 30, lecture: 3,
    text: "SDLC-in mərhələləri ardıcıllıqla hansılardır?",
    type: "single",
    options: [
      "Kodlaşdırma → Test → Planlaşdırma → Dizayn → Deployment",
      "Tələblərin toplanması → Analiz → Dizayn → İnkişaf → Test → Deployment",
      "Test → Tələblər → Analiz → Deployment → Kodlaşdırma",
      "Dizayn → Kodlaşdırma → Deployment → Test → Tələblər",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 31, lecture: 3,
    text: "SDLC-nin 'Requirement Gathering' mərhələsində QA-nın əsas vəzifəsi nədir?",
    type: "single",
    options: [
      "Test ssenariləri icra etmək",
      "Tələblərin test edilə bilən (testable) olub-olmadığını qiymətləndirmək",
      "Kodu yazmaq",
      "Müştəriyə proqramı göstərmək",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 32, lecture: 3,
    text: "SDLC-nin 'Design' mərhələsindəQA nə ilə məşğul olur?",
    type: "single",
    options: [
      "Bug report yazır",
      "Gələcək test strategiyasını planlaşdırır, test planları hazırlayır",
      "Deployment edir",
      "Müştəri ilə müqavilə bağlayır",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 33, lecture: 3,
    text: "Agile metodologiyasında QA və developer necə işləyir?",
    type: "single",
    options: [
      "Developer bitirdi, QA başlayır",
      "QA yalnız son sprint-də iştirak edir",
      "Paralel işləyirlər — QA hər sprint daxilində inkişafla eyni vaxtda test edir",
      "QA yalnız müştəri ilə görüşlərə qatılır",
    ],
    correctAnswers: [2], difficulty: "easy", points: 3,
  },
  {
    id: 34, lecture: 3,
    text: "SDLC-nin 'Testing' mərhələsindəki test növlərindən hansılar aiddir? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Funksional test",
      "İnteqrasiya testi",
      "Sistem testi",
      "Qəbul testi",
      "Kodun yazılması",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "medium", points: 5,
  },
  {
    id: 35, lecture: 3,
    text: "'Testable' olmayan tələb gələcəkdə nəyə səbəb olur?",
    type: "single",
    options: [
      "Daha sürətli inkişafa",
      "Bug-lara və mübahisələrə",
      "Daha az test edilmiş məhsula",
      "Daha ucuz layihəyə",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 36, lecture: 3,
    text: "Waterfall modeli nə zaman daha uyğundur?",
    type: "single",
    options: [
      "Tələblər tez-tez dəyişəndə",
      "Tələblər tam və dəqiq müəyyənləşdirildiyi, dəyişkənliyin az olduğu layihələrdə",
      "Çox kiçik layihələrdə",
      "Yalnız mobil tətbiqlərdə",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 37, lecture: 3,
    text: "Impact (Təsir) SDLC kontekstində nəyi ifadə edir?",
    type: "single",
    options: [
      "Problemin baş vermə ehtimalı",
      "Problem baş versə biznesə nə qədər zərər verər",
      "Layihənin ümumi xərci",
      "Komanda üzvlərinin sayı",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 38, lecture: 3,
    text: "Scrum metodologiyasında 'Sprint' nədir?",
    type: "single",
    options: [
      "Bütün layihənin bir dövrü",
      "Adətən 1-4 həftəlik qısa, zaman məhdud inkişaf dövrü",
      "Test mərhələsinin adı",
      "Müştəri ilə ilk görüş",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 39, lecture: 3,
    text: "SDLC-nin 'Development' mərhələsində QA nə edir?",
    type: "single",
    options: [
      "Yalnız gözləyir",
      "Avtomatlaşdırılmış test skriptlərini yazır, test mühitini, test datasını hazırlayır",
      "Müştəriyə demo göstərir",
      "Layihə büdcəsini hesablayır",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 40, lecture: 3,
    text: "Kanban metodologiyasının əsas xüsusiyyəti nədir?",
    type: "single",
    options: [
      "Sabit sprint müddətləri",
      "Görüntülü iş axını idarəetməsi (lövhə), davamlı çatdırılma, WIP limitləri",
      "Yalnız böyük komandalar üçün uyğundur",
      "Müştəri iştirakını tələb etmir",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },
  {
    id: 41, lecture: 3,
    text: "SDLC-nin 'Analysis' mərhələsinin məqsədi nədir?",
    type: "single",
    options: [
      "Kodun yazılması",
      "Toplanmış tələblərin texniki imkanlar və risklər baxımından təhlili",
      "Test ssenariləri yaratmaq",
      "İstifadəçi interfeysi dizayn etmək",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 42, lecture: 3,
    text: "SDLC-nin hansı mərhələsindəki QA işi ən ucuzdur?",
    type: "single",
    options: [
      "Test mərhələsindəki işlər",
      "Deployment sonrakı işlər",
      "Tələblər mərhələsindəki işlər — erken aşkarlama xərcləri azaldır",
      "Production sonrası düzəlişlər",
    ],
    correctAnswers: [2], difficulty: "hard", points: 8,
  },
  {
    id: 43, lecture: 3,
    text: "Agile metodologiyasının ənənəvi (Waterfall) modeldən fərqi nədir? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Agile-da dəyişikliklərə açıqlıq var",
      "Agile-da qısa iterasiyalar (sprint-lər) var",
      "Agile-da müştəri əməkdaşlığı daha güclüdür",
      "Agile-da sənədlər hər şeydən üstündür",
      "Agile-da daimi çatdırılma prinsipi var",
    ],
    correctAnswers: [0, 1, 2, 4], difficulty: "hard", points: 8,
  },

  // ════════════════════════════════════════════════════════
  // MÜHAZIRƏ 4 — STLC, Test Plan, Test Case (14 sual)
  // ════════════════════════════════════════════════════════
  {
    id: 44, lecture: 4,
    text: "STLC nədir?",
    type: "single",
    options: [
      "Proqram təminatının inkişaf prosesi",
      "Test fəaliyyətlərinin mərhələli və sistemli şəkildə planlaşdırılması, icrası və bağlanması prosesi",
      "Avtomatlaşdırılmış test aləti",
      "Agile metodologiyasının bir hissəsi",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 45, lecture: 4,
    text: "STLC-nin 'Requirement Analysis' mərhələsinin məqsədi nədir?",
    type: "single",
    options: [
      "Test ssenariləri icra etmək",
      "Layihənin funksional və qeyri-funksional tələblərini tam anlamaq, test sahələrini müəyyənləşdirmək",
      "Deployment etmək",
      "Kod yazmaq",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 46, lecture: 4,
    text: "Test Plan-da hansı məlumatlar yer alır?",
    type: "multiple",
    options: [
      "Test strategiyası",
      "Komanda strukturu və rollar",
      "İstifadə olunacaq alətlər",
      "Test növləri",
      "Proqramçının əmək haqqı",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "medium", points: 5,
  },
  {
    id: 47, lecture: 4,
    text: "Risk əsaslı test yanaşmasında test prioriteti necə müəyyən edilir?",
    type: "single",
    options: [
      "Ən çox vaxt alan testlər önə keçir",
      "Ən sadə testlər əvvəl icra edilir",
      "Riskə görə — təsiri böyük və baş vermə ehtimalı yüksək olan funksiyalar əvvəlcə test edilir",
      "Test ssenarilərinin sayına görə",
    ],
    correctAnswers: [2], difficulty: "medium", points: 5,
  },
  {
    id: 48, lecture: 4,
    text: "'Entry Criteria' nədir?",
    type: "single",
    options: [
      "Test mərhələsinin bitməsi üçün tələb olunan şərtlər",
      "Test mərhələsinin başlaya bilməsi üçün tələb olunan ilkin şərtlər",
      "Bug report-ların formatı",
      "Deployment üçün şərtlər",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 49, lecture: 4,
    text: "'Exit Criteria' nədir?",
    type: "single",
    options: [
      "Test prosesinin başlaması üçün ilkin şərtlər",
      "Test mərhələsinin tamamlanmış sayıla bilməsi üçün qarşılanması lazım olan şərtlər",
      "Proqramçıların işini bitirməsi üçün standartlar",
      "Müştəri razılığının alınma qaydaları",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 50, lecture: 4,
    text: "Test Case-in əsas elementləri hansılardır? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Test Case ID",
      "Addımlar (Test Steps)",
      "Gözlənən nəticə (Expected Result)",
      "Faktiki nəticə (Actual Result)",
      "Proqramçının adı",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "medium", points: 5,
  },
  {
    id: 51, lecture: 4,
    text: "STLC-nin 'Test Planning' mərhələsinin məqsədi nədir?",
    type: "single",
    options: [
      "Test ssenariləri icra etmək",
      "Resursların, vaxtın, strategiyanın və alətlərin planlaşdırılması",
      "Bug-ları fix etmək",
      "İstifadəçi interface-ini test etmək",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 52, lecture: 4,
    text: "STLC-nin 'Requirement Analysis' mərhələsindəki 'Clarification Meeting' nəyə xidmət edir?",
    type: "single",
    options: [
      "Komanda üzvlərini tanıtmaq",
      "Qeyri-müəyyən, natamam və ya ziddiyyətli tələblərə aydınlıq gətirmək",
      "Test alətlərini seçmək",
      "Deployment planı hazırlamaq",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 53, lecture: 4,
    text: "'In-Scope' və 'Out-of-Scope' anlayışları nəyi ifadə edir?",
    type: "single",
    options: [
      "Test ssenariləri uğurlu keçib-keçmədiyini",
      "Testin hansı hissələri əhatə edəcəyi (in-scope) və hansıların test çərçivəsindən kənarda qalacağı (out-of-scope)",
      "Proqramın versiya nömrəsini",
      "Müştərinin tələb etdiyi funksiyaları",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },
  {
    id: 54, lecture: 4,
    text: "Test Planning mərhələsindəki 'Shift-Left' yanaşması nəyi ifadə edir?",
    type: "single",
    options: [
      "Test fəaliyyətlərini mümkün qədər sol tərəfə, yəni erkən mərhələlərə sürüşdürmək",
      "Yalnız son test mərhələsinə fokuslanmaq",
      "Sol əllə yazılmış test ssenariləri",
      "Test prosesini sona saxlamaq",
    ],
    correctAnswers: [0], difficulty: "hard", points: 8,
  },
  {
    id: 55, lecture: 4,
    text: "STLC-nin hansı mərhələsindəki 'Question Tracker' tətbiq edilir?",
    type: "single",
    options: [
      "Test Execution",
      "Requirement Analysis — tələblərlə bağlı suallar rəsmi şəkildə qeyd edilir",
      "Test Closure",
      "Deployment",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 56, lecture: 4,
    text: "Test Plan-da komanda strukturu niyə müəyyən edilir?",
    type: "single",
    options: [
      "Layihə büdcəsini azaltmaq üçün",
      "Kim hansı test növlərini icra edəcəyini və məsuliyyət sahələrini aydınlaşdırmaq üçün",
      "Proqramçıların iş saatlarını qeyd etmək üçün",
      "Müştəriyə hesabat vermək üçün",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 57, lecture: 4,
    text: "Aşağıdakı test alətlərindən hansıları test idarəetmə alətləridir? (Hamısını seçin)",
    type: "multiple",
    options: [
      "TestRail",
      "Zephyr",
      "Jira",
      "Postman",
      "Trello",
    ],
    correctAnswers: [0, 1, 2, 4], difficulty: "hard", points: 8,
  },

  // ════════════════════════════════════════════════════════
  // MÜHAZIRƏ 5 — Test Növləri (Funksional) (15 sual)
  // ════════════════════════════════════════════════════════
  {
    id: 58, lecture: 5,
    text: "Test Level ilə Test Type arasındakı fərq nədir?",
    type: "single",
    options: [
      "Eyni şeydir",
      "Test Level — harada test edirik (Unit, Integration, System, UAT); Test Type — nəyi/necə test edirik (Functional, Performance, Regression...)",
      "Test Level — avtomatik, Test Type — manual testdir",
      "Test Level — qeyri-funksional, Test Type — funksional testdir",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 59, lecture: 5,
    text: "Smoke Testing nədir?",
    type: "single",
    options: [
      "Sistemin tam funksionallığını yoxlayan test",
      "Yeni build-in əsas funksiyalarının işlədiyini yoxlayan sürətli ilkin test",
      "Yalnız server performansını yoxlayan test",
      "Müştəri tərəfindən aparılan test",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 60, lecture: 5,
    text: "Sanity Testing nə zaman aparılır?",
    type: "single",
    options: [
      "İlk dəfə build gəldikdə",
      "Bug fix-dən sonra, həmin dəyişikliyin düzgün işlədiyini yoxlamaq üçün",
      "Yalnız production-a çıxmazdan əvvəl",
      "Hər gün səhər saatlarında",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 61, lecture: 5,
    text: "Regression Testing-in məqsədi nədir?",
    type: "single",
    options: [
      "Yalnız yeni funksiyaları test etmək",
      "Edilən dəyişikliklərin köhnə funksiyaları pozub-pozmadığını yoxlamaq",
      "Yalnız UI testlərini icra etmək",
      "Sistemin performansını ölçmək",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 62, lecture: 5,
    text: "Black Box Testing nədir?",
    type: "single",
    options: [
      "Daxili kod strukturunu bilərək aparılan test",
      "Sistemin daxili strukturunu bilmədən, yalnız giriş-çıxış davranışlarını yoxlayan test",
      "Yalnız developer-lər tərəfindən aparılan test",
      "Şifrəli sistemlər üçün test",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 63, lecture: 5,
    text: "White Box Testing nədir?",
    type: "single",
    options: [
      "Sistemin daxili kod strukturunu bilmədən aparılan test",
      "Sistemin daxili kod strukturunu bilərək, kod yollarını, məntiq budaqlarını yoxlayan test",
      "Yalnız istifadəçi interfeysi testi",
      "Performans testi növü",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 64, lecture: 5,
    text: "Grey Box Testing nədir?",
    type: "single",
    options: [
      "Tam Black Box test",
      "Tam White Box test",
      "Sistemin qismən daxili strukturunu bilərək aparılan test — Black Box və White Box-un kombinasiyası",
      "Yalnız boz rəngli interfeyslər üçün test",
    ],
    correctAnswers: [2], difficulty: "medium", points: 5,
  },
  {
    id: 65, lecture: 5,
    text: "Unit Testing nədir?",
    type: "single",
    options: [
      "Sistemin bütövlükdə test edilməsi",
      "Ən kiçik test edilə bilən kod vahidlərinin (funksiya, metod) ayrılıqda test edilməsi",
      "İstifadəçi qəbul testi",
      "İnteqrasiya testi növü",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 66, lecture: 5,
    text: "Integration Testing nəyin test edilməsinə yönəlmişdir?",
    type: "single",
    options: [
      "Ayrı-ayrı kod vahidlərinin test edilməsi",
      "Birləşdirilmiş komponentlər və ya modullar arasındakı qarşılıqlı əlaqənin test edilməsi",
      "Bütün sistemin funksionallığının test edilməsi",
      "Son istifadəçi tərəfindən aparılan test",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 67, lecture: 5,
    text: "UAT (User Acceptance Testing) kimin tərəfindən aparılır?",
    type: "single",
    options: [
      "Proqramçılar tərəfindən",
      "QA komandası tərəfindən",
      "Son istifadəçilər və ya müştəri tərəfindən",
      "Server administratoru tərəfindən",
    ],
    correctAnswers: [2], difficulty: "easy", points: 3,
  },
  {
    id: 68, lecture: 5,
    text: "Funksional Testing nəyi yoxlayır?",
    type: "single",
    options: [
      "Sistemin performansını",
      "Sistemin funksiyalarının iş tələblərinə uyğun düzgün işlədiyini",
      "Sistemin yüklənmə altındakı davranışını",
      "Sistemin təhlükəsizliyini",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 69, lecture: 5,
    text: "Funksional Testing-də test olunan sahələr hansılardır? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Giriş formaları (login)",
      "Əlavə etmə və silmə funksiyaları",
      "API cavabları",
      "Hesablama və məlumat axını",
      "Şəbəkənin sürəti",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "medium", points: 5,
  },
  {
    id: 70, lecture: 5,
    text: "Re-testing ilə Regression Testing arasındakı fərq nədir?",
    type: "single",
    options: [
      "Eyni şeydir",
      "Re-testing — konkret bug-ın fix edildiyini yoxlayır; Regression — dəyişikliklərin başqa funksiyaları pozub-pozmadığını yoxlayır",
      "Re-testing avtomatik, Regression manualdir",
      "Regression daha sürətlidir",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },
  {
    id: 71, lecture: 5,
    text: "System Testing nəyi əhatə edir?",
    type: "single",
    options: [
      "Yalnız bir komponentin test edilməsi",
      "Bütövlükdə inteqrasiya olunmuş sistemin test edilməsi",
      "Yalnız UI testlərinin aparılması",
      "Developer-lərin öz kodlarını test etməsi",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 72, lecture: 5,
    text: "Koddan istifadə vəziyyətinə görə test növləri hansılardır?",
    type: "single",
    options: [
      "Unit, Integration, System, Acceptance",
      "Black Box, White Box, Grey Box",
      "Manual, Automation",
      "Smoke, Sanity, Regression",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },

  // ════════════════════════════════════════════════════════
  // MÜHAZIRƏ 6 — Qeyri-Funksional Testlər (14 sual)
  // ════════════════════════════════════════════════════════
  {
    id: 73, lecture: 6,
    text: "Qeyri-funksional testlər nəyi yoxlayır?",
    type: "single",
    options: [
      "Sistemin NƏ etdiyini",
      "Sistemin NECƏ işlədiyini — sürət, performans, təhlükəsizlik, istifadə rahatlığı",
      "Yalnız giriş formalarını",
      "API-ların funksionallığını",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 74, lecture: 6,
    text: "Performance Testing nəyi ölçür?",
    type: "multiple",
    options: [
      "Cavab sürəti (response time)",
      "Yük altında stabilliyini",
      "CPU və RAM istifadəsi",
      "Şəbəkə sürəti",
      "Proqramçının yazma sürəti",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "medium", points: 5,
  },
  {
    id: 75, lecture: 6,
    text: "Load Testing nədir?",
    type: "single",
    options: [
      "Sistemin çöküşünü öyrənmək üçün həddindən artıq yük vermək",
      "Sistemin gözlənilən istifadəçi yüklənməsi altında necə işlədiyini ölçmək",
      "Yalnız bir istifadəçi ilə test",
      "Performans alətlərinin test edilməsi",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 76, lecture: 6,
    text: "Bir bank sistemi üçün Load Testing ssenarisi: 1000 istifadəçi eyni anda giriş edir. Cavab vaxtı 6 saniyədirsə bu nəyin göstəricisidir?",
    type: "single",
    options: [
      "Sistem mükəmməl işləyir",
      "Performans problemi var",
      "Həmin ssenarinin test edilməsinə ehtiyac yoxdur",
      "Sistem tamamilə çöküb",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 77, lecture: 6,
    text: "Performance Testing nə zaman aparılmalıdır? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Production-a çıxmadan əvvəl",
      "Yeni modul əlavə edildikdə",
      "Yeni istifadəçi sayına keçid zamanı",
      "Periodik yoxlama məqsədilə",
      "Yalnız proqram çöküşündən sonra",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "medium", points: 5,
  },
  {
    id: 78, lecture: 6,
    text: "Security Testing nəyi yoxlayır?",
    type: "single",
    options: [
      "Sistemin yüklənmə altındakı davranışını",
      "Sistemin icazəsiz girişlərə, hücumlara və data sızmalarına qarşı müdafiəsini",
      "Sistemin UI uyğunluğunu",
      "Sistemin cavab sürətini",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 79, lecture: 6,
    text: "Usability Testing-in əsas məqsədi nədir?",
    type: "single",
    options: [
      "Performans bottleneck-ları tapmaq",
      "Sistemin son istifadəçi tərəfindən nə qədər rahat və intuitiv istifadə oluna biləcəyini yoxlamaq",
      "Serverin RAM istifadəsini ölçmək",
      "API-ların sürətini test etmək",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 80, lecture: 6,
    text: "'Bottleneck' nədir?",
    type: "single",
    options: [
      "Sistemin ən sürətli hissəsi",
      "Sistemin performansını azaldan, darboğaz yaradan zəif nöqtə",
      "Avtomatlaşdırılmış test növü",
      "Test alətinin adı",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 81, lecture: 6,
    text: "Load Testing-in əsas göstəriciləri (metrics) hansılardır? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Cavab vaxtı (Response Time)",
      "CPU istifadəsi",
      "Error rate",
      "Throughput (saniyədəki sorğu sayı)",
      "Proqramçının yazdığı kod sətirləri",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "hard", points: 8,
  },
  {
    id: 82, lecture: 6,
    text: "Stress Testing ilə Load Testing arasındakı fərq nədir?",
    type: "single",
    options: [
      "Eyni şeydir",
      "Load Testing — normal yük altında; Stress Testing — həddini aşan yük ilə sistemin sınır nöqtəsini tapmaq",
      "Stress Testing daha azdır",
      "Load Testing yalnız serverlərdə aparılır",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },
  {
    id: 83, lecture: 6,
    text: "Compatibility Testing nəyi yoxlayır?",
    type: "single",
    options: [
      "Sistemin performansını",
      "Sistemin müxtəlif brauzerlər, əməliyyat sistemləri, cihazlar üzərində düzgün işlədiyini",
      "Sistemin yük altında davranışını",
      "Sistemin təhlükəsizliyini",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 84, lecture: 6,
    text: "CPU istifadəsi 95% olarsa bu nəyi bildirir?",
    type: "single",
    options: [
      "Sistem mükəmməl işləyir",
      "Resurs bottleneck riski var",
      "Test uğurla tamamlandı",
      "Daha çox istifadəçi əlavə etmək olar",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 85, lecture: 6,
    text: "Performance Testing alətləri hansılardır? (Hamısını seçin)",
    type: "multiple",
    options: [
      "JMeter",
      "Gatling",
      "k6",
      "Selenium",
      "Locust",
    ],
    correctAnswers: [0, 1, 2, 4], difficulty: "hard", points: 8,
  },
  {
    id: 86, lecture: 6,
    text: "Qeyri-funksional testlərə aid olan kateqoriyalar hansılardır? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Performance Testing",
      "Security Testing",
      "Usability Testing",
      "Compatibility Testing",
      "Unit Testing",
    ],
    correctAnswers: [0, 1, 2, 3], difficulty: "medium", points: 5,
  },

  // ════════════════════════════════════════════════════════
  // MÜHAZIRƏ 7 — Digər Test Növləri + Test Dizayn Texnikaları (14 sual)
  // ════════════════════════════════════════════════════════
  {
    id: 87, lecture: 7,
    text: "Exploratory Testing nədir?",
    type: "single",
    options: [
      "Əvvəlcədən hazırlanmış test ssenariləri əsasında aparılan test",
      "Əvvəlcədən yazılmış test case-lər olmadan sistemin araşdırılması, öyrənilməsi və eyni zamanda test edilməsi",
      "Yalnız avtomatlaşdırılmış test",
      "Performans testinin növü",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 88, lecture: 7,
    text: "Monkey Testing nədir?",
    type: "single",
    options: [
      "Sistematik test ssenariləri ilə aparılan test",
      "Proqramın istənilən sahəsindəki plansız, ssenarisiz, təsadüfi hərəkətlərlə aparılan test",
      "Yalnız mobil tətbiqlər üçün test",
      "Performans test növü",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 89, lecture: 7,
    text: "Exploratory Testing ən çox hansı hallarda istifadə olunur? (Hamısını seçin)",
    type: "multiple",
    options: [
      "Sistem yeni hazırlanıb, sənədləşmə tam deyil",
      "Vaxt məhdudiyyəti var, tez problem tapmaq lazımdır",
      "Yeni funksionallıqlar əlavə olunub, ilkin yoxlama lazımdır",
      "Sistemin tam sənədləşmiş olduğu hallarda",
      "Standart testlərlə tapılması çətin bug-ları tapmaq üçün",
    ],
    correctAnswers: [0, 1, 2, 4], difficulty: "medium", points: 5,
  },
  {
    id: 90, lecture: 7,
    text: "End-to-End (E2E) Testing nədir?",
    type: "single",
    options: [
      "Yalnız unit testlər",
      "İstifadəçinin real iş ssenarilərini başdan sona qədər simulyasiya edərək bütün sistemin test edilməsi",
      "Yalnız API testlər",
      "Performans test növü",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 91, lecture: 7,
    text: "Equivalence Partitioning (EP) test dizayn texnikası nədir?",
    type: "single",
    options: [
      "Hər mümkün dəyəri test etmək",
      "Giriş məlumatlarını ekvivalent bölmələrə ayırmaq; hər bölmədən bir nümunəvi test dəyəri seçmək",
      "Yalnız hədd dəyərlərini test etmək",
      "Şərti cədvəl qurmaq",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 92, lecture: 7,
    text: "Boundary Value Analysis (BVA) nədir?",
    type: "single",
    options: [
      "Giriş sahəsinin orta dəyərlərini test etmək",
      "Ekvivalent bölmələrin hədd dəyərlərini (minimum, maksimum, onların ±1-i) test etmək",
      "Bütün mümkün dəyərləri test etmək",
      "Yalnız yanlış giriş dəyərlərini test etmək",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 93, lecture: 7,
    text: "Yaş sahəsi 18-65 aralığında qəbul edirsə, BVA üçün test dəyərləri hansılar olmalıdır?",
    type: "multiple",
    options: [
      "17 (hədd altı)",
      "18 (aşağı hədd)",
      "40 (orta dəyər)",
      "65 (yuxarı hədd)",
      "66 (hədd üstü)",
    ],
    correctAnswers: [0, 1, 3, 4], difficulty: "hard", points: 8,
  },
  {
    id: 94, lecture: 7,
    text: "Decision Table Testing hansı hallarda ən effektivdir?",
    type: "single",
    options: [
      "Sadə, tək şərtli məntiqdə",
      "Çoxlu şərtlər və onların kombinasiyalarının müxtəlif nəticələrə yol açdığı mürəkkəb iş məntiqi üçün",
      "Yalnız performans testlərində",
      "API test etməkdə",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 95, lecture: 7,
    text: "State Transition Testing nəyi modelləşdirir?",
    type: "single",
    options: [
      "Sistemin yük altındakı davranışını",
      "Sistemin müxtəlif vəziyyətlər arasında keçidlərini — hadisə baş verdikdə hansı vəziyyətdən hansıya keçilir",
      "İstifadəçi interfeysinin rəng dəyişikliyini",
      "Verilənlər bazasının strukturunu",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 96, lecture: 7,
    text: "Error Guessing texnikası nəyə əsaslanır?",
    type: "single",
    options: [
      "Formal riyazi modelə",
      "Testçinin təcrübəsi, intuisiyası və keçmiş xətalar haqqında biliklərinə",
      "Yalnız sənədlərə",
      "Avtomatlaşdırılmış alətlərə",
    ],
    correctAnswers: [1], difficulty: "easy", points: 3,
  },
  {
    id: 97, lecture: 7,
    text: "Ad-hoc Testing ilə Exploratory Testing arasındakı fərq nədir?",
    type: "single",
    options: [
      "Eyni şeydir",
      "Ad-hoc tam spontan və sənədsizdir; Exploratory-da məqsəd, öyrənmə və qeydlər var",
      "Ad-hoc daha sistematikdir",
      "Exploratory yalnız avtomatlaşdırılmış şəkildə aparılır",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },
  {
    id: 98, lecture: 7,
    text: "Alpha Testing ilə Beta Testing arasındakı fərq nədir?",
    type: "single",
    options: [
      "Eyni şeydir",
      "Alpha — şirkətin daxilindəki istifadəçilər tərəfindən; Beta — real son istifadəçilər tərəfindən aparılır",
      "Alpha avtomatik, Beta manualdir",
      "Beta daha erkən mərhələdə aparılır",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 99, lecture: 7,
    text: "Localization Testing nəyi yoxlayır?",
    type: "single",
    options: [
      "Sistemin yüklənmə sürətini",
      "Proqramın müxtəlif dillərə, mədəniyyətlərə və regional parametrlərə düzgün uyğunlaşdırılıb-uyğunlaşdırılmadığını",
      "Serverlərin coğrafi yerləşməsini",
      "Məlumatların şifrələnməsini",
    ],
    correctAnswers: [1], difficulty: "medium", points: 5,
  },
  {
    id: 100, lecture: 7,
    text: "Recovery Testing nəyi yoxlayır?",
    type: "single",
    options: [
      "Sistemin istifadəçi yükünü",
      "Sistemin çöküş, qəza və ya kritik xəta hallarından sonra necə bərpa olunduğunu",
      "Sistemin şifrəsini",
      "Sistemin cavab sürətini",
    ],
    correctAnswers: [1], difficulty: "hard", points: 8,
  },
];

export const MAX_SCORE = questions.reduce((sum, q) => sum + q.points, 0);

export function calculateScore(
  answers: Record<number, number[]>
): { score: number; correct: number } {
  let score = 0;
  let correct = 0;
  for (const question of questions) {
    const given = (answers[question.id] ?? []).slice().sort((a,b)=>a-b);
    const expected = question.correctAnswers.slice().sort((a,b)=>a-b);
    const isCorrect =
      given.length === expected.length &&
      given.every((v, i) => v === expected[i]);
    if (isCorrect) {
      score += question.points;
      correct++;
    }
  }
  return { score, correct };
}
