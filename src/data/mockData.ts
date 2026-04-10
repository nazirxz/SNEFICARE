export interface SessionDefinition {
  day: number;
  title: string;
  theme: string;
  colorFrom: string;
  colorTo: string;
  edukasi: {
    title: string;
    content: string[];
    keyPoints: string[];
  };
  musik: {
    title: string;
    description: string;
    duration: number;
    musicType: string;
  };
  afirmasi: {
    title: string;
    mainText: string;
    supportText: string;
    instructions: string;
    /** Kalimat positive self-talk opsional; jika ada, UI menampilkan pemilih sebelum rekaman. */
    positivePhrases?: string[];
  };
  refleksi: {
    title: string;
    questions: { id: string; label: string; placeholder: string }[];
  };
}

export interface SessionRecord {
  day: number;
  status: 'belum' | 'berlangsung' | 'selesai';
  approvalStatus?: 'menunggu' | 'disetujui' | 'ditolak';
  approvalNote?: string;
  approvedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  mood?: number;
  refleksiAnswers?: { [key: string]: string };
  afirmasiNote?: string;
  modulesCompleted?: string[];
  /**
   * URL rekaman suara afirmasi pasien (mock).
   * Pada implementasi ini digunakan untuk memungkinkan perawat memutar kembali suara afirmasi.
   */
  affirmationAudioUrl?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  chemoCycle: string;
  startDate: string;
  currentDay: number;
  username: string;
  password: string;
  phone: string;
  sessions: SessionRecord[];
}

export interface Nurse {
  id: string;
  name: string;
  nip: string;
  department: string;
  username: string;
  password: string;
}

/** 15 sesi selesai + disetujui untuk akun demo post-test */
function demoPostTestSessions(): SessionRecord[] {
  return Array.from({ length: 15 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      status: "selesai" as const,
      completedAt: `2026-03-${String(day).padStart(2, "0")}T10:00:00.000Z`,
      durationMinutes: 28,
      mood: 3,
      approvalStatus: "disetujui" as const,
      refleksiAnswers: { q1: "(akun demo post-test)", q2: "(akun demo post-test)" },
      afirmasiNote: "",
    };
  });
}

export const sessions: SessionDefinition[] = [
  {
    day: 1,
    title: "Gejala Pasca Kemoterapi & Self-Efficacy",
    theme: "Edukasi, Relaksasi, dan Positive Self-Talk",
    colorFrom: "#E8A4C8",
    colorTo: "#C96B8A",
    edukasi: {
      title: "Edukasi: Tanda dan Gejala Pasca Kemoterapi",
      content: [
        "Kemoterapi adalah pengobatan kanker yang bekerja dengan membunuh sel kanker. Namun, obat ini juga dapat memengaruhi sel normal, sehingga menimbulkan berbagai gejala selama atau setelah terapi. Gejala ini berbeda pada setiap pasien.",
        "1. Kelelahan (fatigue) — Terasa sangat lelah meskipun tidak banyak aktivitas, tidak hilang walaupun sudah istirahat, dan bisa berlangsung lama setelah kemoterapi selesai. Penyebabnya, tubuh kekurangan energi karena pengaruh obat dan kondisi penyakit.",
        "2. Mual dan muntah — Terjadi akibat efek obat kemoterapi pada otak dan saluran cerna. Bisa muncul segera atau beberapa hari setelah terapi.",
        "3. Gangguan konsentrasi (chemo brain) — Sulit fokus, mudah lupa, dan merasa lambat berpikir.",
        "4. Kesemutan atau mati rasa (neuropati) — Kesemutan di tangan atau kaki, mati rasa, atau nyeri seperti terbakar.",
        "5. Gangguan makan dan pencernaan — Nafsu makan menurun, sariawan (mukositis), diare atau sembelit.",
        "6. Penurunan daya tahan tubuh — Mudah terkena infeksi dan bisa disertai kelelahan akibat anemia.",
        "7. Perubahan emosi — Merasa sedih, cemas, atau depresi adalah hal yang wajar dialami.",
        "Setelah kemoterapi, gejala seperti kelelahan, mual, gangguan saraf, dan perubahan emosi wajar terjadi dan sering muncul bersamaan. Penting mengenali gejala sejak dini agar dapat ditangani dengan baik dan kualitas hidup tetap terjaga.",
      ],
      keyPoints: [
        "Gejala pasca kemoterapi bervariasi dan bisa muncul bersamaan",
        "Mengenali gejala sejak dini membantu penanganan dan kualitas hidup",
        "Segera hubungi tim kesehatan jika gejala mengganggu atau memburuk",
        "Selesaikan seluruh sesi hari ini; setelah perawat menyetujui, kamu dapat melanjutkan ke hari berikutnya",
      ],
    },
    musik: {
      title: "Musik Relaksasi",
      description:
        "Musik relaksasi adalah musik yang membantu tubuh dan pikiran menjadi lebih tenang. Manfaatnya antara lain mengurangi stres dan cemas, membuat tubuh lebih rileks, membantu tidur lebih nyenyak, dan membuat pasien merasa lebih nyaman. Saat tubuh tenang, pikiran cenderung lebih jernih, perasaan lebih stabil, dan kamu bisa merasa lebih mampu menghadapi penyakit — ini mendukung self-efficacy, yaitu keyakinan bahwa kamu mampu menghadapi masalah dan menjalani pengobatan. Tutup matamu, ambil napas perlahan, dan biarkan irama menemanimu.",
      duration: 300,
      musicType: "Relaksasi",
    },
    afirmasi: {
      title: "Positive Self-Talk & Self-Efficacy",
      mainText: "Saya kuat menjalani semua ini.",
      supportText:
        "Musik relaksasi dan positive self-talk adalah metode sederhana untuk meningkatkan self-efficacy: musik menenangkan tubuh, self-talk membangun keyakinan diri. Dengan keduanya, kamu bisa merasa lebih kuat, tenang, dan mampu menghadapi kondisi kesehatanmu.",
      instructions:
        "Positive self-talk berarti berbicara positif kepada diri sendiri — mengurangi rasa takut, menambah semangat, membantu berpikir positif, dan meningkatkan kepercayaan diri. Pilih salah satu kalimat di bawah, lalu bacakan dengan suara pelan namun penuh keyakinan. Letakkan tangan di dadamu bila nyaman, dan ulangi beberapa kali.",
      positivePhrases: [
        "Saya kuat menjalani semua ini.",
        "Saya mampu melewati setiap tahap pengobatan.",
        "Saya bisa menghadapi hari ini dengan baik.",
        "Saya percaya pada kemampuan diri saya.",
        "Saya mampu mengatasi tantangan ini.",
        "Saya lebih kuat dari yang saya kira.",
        "Saya tidak menyerah pada keadaan ini.",
        "Saya terus berusaha untuk sembuh.",
        "Tidak apa-apa jika saya lelah, saya tetap kuat.",
        "Saya memberi waktu tubuh saya untuk beristirahat.",
        "Tubuh saya sedang bekerja untuk pulih.",
        "Saya mendengarkan kebutuhan tubuh saya.",
        "Saya bisa beristirahat tanpa merasa bersalah.",
        "Sedikit demi sedikit, saya tetap bergerak.",
        "Saya menghargai setiap usaha kecil saya.",
        "Saya bisa mengendalikan diri saya.",
        "Saya bernapas perlahan dan tenang.",
        "Tubuh saya akan kembali membaik.",
        "Saya mampu melewati ketidaknyamanan ini.",
        "Saya tetap berharga apa adanya.",
        "Tubuh saya telah berjuang dengan luar biasa.",
        "Saya menerima diri saya dengan penuh kasih.",
        "Saya bangga dengan diri saya.",
        "Nilai diri saya tidak berubah.",
        "Saya menghargai tubuh saya apa adanya.",
        "Saya tidak sendirian dalam perjalanan ini.",
        "Saya mampu melewati masa sulit ini.",
        "Tubuh dan pikiran saya selaras.",
        "Setiap hari saya semakin kuat.",
        "Saya terus melangkah maju sedikit demi sedikit.",
      ],
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Bagaimana perasaanmu hari ini secara keseluruhan?", placeholder: "Ceritakan perasaanmu dengan jujur dan bebas..." },
        { id: "q2", label: "Apa satu hal yang kamu syukuri hari ini, sekecil apapun itu?", placeholder: "Bahkan hal kecil pun sangat berarti..." },
      ],
    },
  },
  {
    day: 2,
    title: "Tubuhku Setelah Mastektomi",
    theme: "Pemahaman Diri",
    colorFrom: "#B8A4E8",
    colorTo: "#7B6BB4",
    edukasi: {
      title: "Memahami Perubahan Tubuhku",
      content: [
        "Tubuhmu telah melalui perjalanan yang sangat berat — dan itu adalah bukti kekuatanmu yang luar biasa. Mastektomi adalah langkah medis yang diambil untuk melindungimu, dan tubuhmu kini sedang dalam proses penyembuhan yang menakjubkan.",
        "Sangat normal jika kamu merasakan berbagai perasaan tentang perubahanmu — mulai dari sedih, bingung, sampai marah. Semua perasaan itu sah dan wajar. Tidak ada yang salah dengan dirimu.",
        "Tubuhmu tetaplah tubuhmu — indah, berharga, dan penuh keberanian. Bekas luka yang ada adalah tanda perjuanganmu, bukan kekurangan. Banyak perempuan yang telah melewati perjalanan ini dan menemukan kembali rasa cinta pada diri mereka sendiri.",
        "Penting untuk mengenali sensasi yang mungkin kamu rasakan: mati rasa, kesemutan, atau rasa tidak nyaman di area operasi. Ini semua adalah bagian dari proses pemulihan saraf dan jaringan yang sedang berlangsung.",
      ],
      keyPoints: [
        "Perubahan tubuh setelah mastektomi adalah proses yang normal",
        "Semua perasaan tentang tubuhmu adalah sah dan wajar",
        "Bekas luka adalah tanda keberanian, bukan kekurangan",
        "Sensasi mati rasa atau kesemutan akan berangsur membaik",
      ],
    },
    musik: {
      title: "Musik Piano Lembut: Healing Touch",
      description: "Dengarkan melodi piano yang lembut ini sambil meletakkan tanganmu di area yang terasa nyaman. Bayangkan energi penyembuhan mengalir di seluruh tubuhmu.",
      duration: 300,
      musicType: "Piano Meditasi",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Tubuhku sedang berjuang dan pulih, dan aku mencintainya apa adanya.",
      supportText: "Cintai tubuhmu di setiap tahap perjalanannya.",
      instructions: "Sambil membaca afirmasi ini, letakkan tangan dengan lembut di dadamu. Rasakan kehangatan dan kasih sayangmu untuk dirimu sendiri.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Apa yang kamu rasakan tentang tubuhmu hari ini?", placeholder: "Ceritakan dengan jujur, tidak ada yang salah..." },
        { id: "q2", label: "Apa satu hal yang ingin kamu katakan kepada tubuhmu sebagai bentuk apresiasi?", placeholder: "Berikan penghargaan untuk tubuhmu yang berani..." },
      ],
    },
  },
  {
    day: 3,
    title: "Mengelola Efek Kemoterapi",
    theme: "Manajemen Gejala",
    colorFrom: "#A4D4C8",
    colorTo: "#4A9B8A",
    edukasi: {
      title: "Kemoterapi dan Cara Mengatasinya",
      content: [
        "Kemoterapi bekerja dengan keras untuk melawan sel-sel yang tidak diinginkan dalam tubuhmu. Namun, obat yang kuat ini juga bisa menyebabkan efek samping yang membuat hari-harimu terasa lebih berat.",
        "Mual dan muntah bisa dikelola dengan makan dalam porsi kecil tapi sering, menghindari makanan berbau tajam, dan mengonsumsi obat anti-mual sesuai anjuran doktermu.",
        "Kelelahan adalah salah satu efek paling umum. Ijinkan dirimu untuk beristirahat lebih banyak dari biasanya. Ini bukan kelemahan — ini adalah tubuhmu yang sedang bekerja keras untuk sembuh.",
        "Jika rambutmu mulai rontok, ketahuilah bahwa ini bersifat sementara. Banyak wanita menemukan cara baru untuk mengekspresikan kecantikan mereka selama masa ini, dan rambut akan tumbuh kembali.",
      ],
      keyPoints: [
        "Mual: makan porsi kecil, hindari bau tajam, minum air putih pelan-pelan",
        "Kelelahan: istirahat yang cukup adalah obat terbaik",
        "Rambut rontok bersifat sementara dan akan tumbuh kembali",
        "Selalu konsultasikan gejala berat dengan tim medismu",
      ],
    },
    musik: {
      title: "Musik Gelombang Laut: Ocean Calm",
      description: "Biarkan suara ombak yang ritmis membantumu bernapas lebih dalam. Bayangkan setiap ombak membawa ketenangan, dan setiap surutnya membawa rasa tidak nyaman yang berlahan menghilang.",
      duration: 300,
      musicType: "Suara Alam",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Setiap hari aku semakin kuat. Tubuhku pulih dengan caranya yang ajaib.",
      supportText: "Percayakan proses penyembuhanmu kepada tubuhmu yang luar biasa.",
      instructions: "Ulangi kalimat ini tiga kali, dengan semakin dalam dan tenang. Rasakan keyakinan itu tumbuh di dadamu.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Efek samping apa yang paling kamu rasakan hari ini, dan bagaimana kamu mengatasinya?", placeholder: "Ceritakan pengalamanmu menghadapi gejala hari ini..." },
        { id: "q2", label: "Apa yang membantumu merasa lebih baik hari ini?", placeholder: "Bisa hal kecil seperti makanan, percakapan, atau momen ketenangan..." },
      ],
    },
  },
  {
    day: 4,
    title: "Kekuatan Napas",
    theme: "Teknik Pernapasan",
    colorFrom: "#A4C8E8",
    colorTo: "#5A8FBF",
    edukasi: {
      title: "Teknik Pernapasan untuk Ketenangan",
      content: [
        "Tahukah kamu bahwa cara kamu bernapas memiliki kekuatan besar untuk menenangkan sistem sarafmu? Ketika kita cemas atau kesakitan, napas kita cenderung menjadi pendek dan cepat. Ini malah memperparah perasaan tidak nyaman.",
        "Teknik pernapasan dalam yang paling sederhana adalah pernapasan 4-7-8: hirup napas selama 4 hitungan, tahan selama 7 hitungan, lalu hembuskan perlahan selama 8 hitungan. Lakukan ini 3-4 kali.",
        "Ada juga pernapasan perut (diafragma): letakkan satu tangan di dada dan satu di perut. Bernapaslah sehingga hanya tangan di perutmu yang bergerak naik. Ini adalah cara bernapas yang paling menenangkan.",
        "Latih teknik ini setiap kali kamu merasa cemas, kesakitan, atau sebelum tidur. Dengan latihan rutin, tubuhmu akan belajar untuk lebih cepat mencapai ketenangan.",
      ],
      keyPoints: [
        "Pernapasan 4-7-8: hirup 4, tahan 7, hembuskan 8 hitungan",
        "Pernapasan perut lebih menenangkan daripada pernapasan dada",
        "Lakukan 3-4 siklus saat merasa cemas atau tidak nyaman",
        "Dapat dilakukan kapan saja dan di mana saja",
      ],
    },
    musik: {
      title: "Panduan Pernapasan: Guided Breathing",
      description: "Musik ini dirancang dengan ritme yang memandu napasmu secara alami. Ikuti iramanya — ketika musik naik, hirup napas; ketika turun, hembuskan perlahan.",
      duration: 300,
      musicType: "Panduan Meditasi",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Setiap napas membawa ketenangan dan kedamaian ke dalam diriku.",
      supportText: "Napasmu adalah jangkarmu di saat badai sekalipun.",
      instructions: "Sambil membaca afirmasi ini, hirup napas dalam-dalam, tahan sejenak, lalu hembuskan perlahan. Rasakan ketenangan yang masuk bersama udaramu.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Bagaimana perasaanmu setelah mencoba teknik pernapasan hari ini?", placeholder: "Apakah ada perubahan yang kamu rasakan?" },
        { id: "q2", label: "Kapan momen paling sulit hari ini, dan bagaimana napas membantumu?", placeholder: "Ceritakan pengalamanmu..." },
      ],
    },
  },
  {
    day: 5,
    title: "Citra Diri yang Indah",
    theme: "Penghargaan Diri",
    colorFrom: "#E8C4A4",
    colorTo: "#C48040",
    edukasi: {
      title: "Menemukan Keindahan dalam Dirimu",
      content: [
        "Perubahan penampilan yang terjadi selama pengobatan dapat memengaruhi cara kamu memandang dirimu. Ini adalah reaksi yang sangat manusiawi dan banyak dirasakan oleh perempuan dalam situasimu.",
        "Namun ketahuilah: kecantikanmu tidak hilang karena pengobatan. Kecantikan sejatimu ada dalam keberanianmu, dalam senyummu, dalam kekuatanmu untuk terus berjuang setiap hari.",
        "Cobalah luangkan waktu untuk merawat diri dengan cara yang terasa nyaman — mungkin merawat kulit, memakai pakaian yang membuat nyaman, atau sekadar menyisir rambut dengan penuh kasih sayang.",
        "Berbicara dengan perempuan lain yang menjalani perjalanan serupa bisa sangat membantu. Komunitas dan kelompok dukungan bisa menjadi sumber kekuatan yang luar biasa.",
      ],
      keyPoints: [
        "Perasaan tentang perubahan penampilan adalah sangat wajar",
        "Kecantikan sejati ada dalam keberanian dan kekuatan batinmu",
        "Merawat diri dengan lembut adalah bentuk cinta pada dirimu",
        "Komunitas dukungan bisa sangat membantu",
      ],
    },
    musik: {
      title: "Musik Harpa: Inner Beauty",
      description: "Biarkan melodi harpa yang lembut ini mengiringimu merenung tentang kecantikan unik yang ada dalam dirimu. Bayangkan cahaya hangat memeluk seluruh tubuhmu.",
      duration: 300,
      musicType: "Harpa Meditasi",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Aku cantik, berharga, dan layak dicintai — apa adanya diriku hari ini.",
      supportText: "Kecantikanmu tidak tergantung pada penampilan luarmu.",
      instructions: "Berdirilah di depan cermin jika bisa, tatap matamu sendiri, dan ucapkan afirmasi ini dengan lembut dan penuh kasih sayang.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Apa yang membuatmu merasa cantik dan berharga hari ini?", placeholder: "Tidak harus tentang penampilan fisik..." },
        { id: "q2", label: "Apa satu hal yang ingin kamu lakukan untuk merawat dirimu besok?", placeholder: "Hal kecil pun sangat berarti..." },
      ],
    },
  },
  {
    day: 6,
    title: "Mengelola Kecemasan",
    theme: "Regulasi Emosi",
    colorFrom: "#C4A4E8",
    colorTo: "#8B5BBF",
    edukasi: {
      title: "Kecemasan adalah Manusiawi",
      content: [
        "Kecemasan selama proses pengobatan kanker adalah hal yang sangat umum — bahkan lebih dari 40% pasien merasakannya. Ini bukan tanda kelemahan, ini adalah respons alami dari seseorang yang menghadapi situasi yang penuh ketidakpastian.",
        "Ketika pikiran mulai berlari ke tempat-tempat yang menakutkan, cobalah teknik grounding 5-4-3-2-1: sebutkan 5 hal yang kamu lihat, 4 yang bisa kamu sentuh, 3 yang kamu dengar, 2 yang kamu cium, dan 1 yang bisa kamu rasakan.",
        "Jurnal kecemasan bisa sangat membantu: tuliskan apa yang membuatmu cemas, lalu tanyakan pada dirimu — seberapa mungkin itu akan benar-benar terjadi? Apa yang bisa aku lakukan jika itu terjadi?",
        "Bicarakan kecemasanmu dengan orang yang kamu percaya — keluarga, teman, atau tim medismu. Menyimpan kecemasan sendiri justru membuatnya terasa lebih besar dari kenyataannya.",
      ],
      keyPoints: [
        "Kecemasan dirasakan oleh lebih dari 40% pasien kanker",
        "Teknik grounding 5-4-3-2-1 membantu saat kecemasan menyerang",
        "Menulis kecemasan membantu memprosesnya",
        "Berbagi perasaan membuat beban terasa lebih ringan",
      ],
    },
    musik: {
      title: "Musik Binaural Beats: Anxiety Relief",
      description: "Frekuensi khusus dalam musik ini dirancang untuk membantu otakmu beralih ke gelombang yang lebih tenang. Gunakan headphone jika tersedia untuk hasil terbaik.",
      duration: 300,
      musicType: "Binaural Beats",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Aku aman. Aku kuat. Aku mampu menghadapi hari ini dengan tenang.",
      supportText: "Kecemasanmu tidak mendefinisikanmu. Kekuatanmulah yang nyata.",
      instructions: "Saat kecemasan datang, ucapkan afirmasi ini dengan perlahan. Letakkan tangan di dada dan rasakan detak jantungmu yang stabil.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Apa yang membuatmu merasa cemas hari ini?", placeholder: "Tidak apa-apa untuk jujur tentang kecemasanmu..." },
        { id: "q2", label: "Apa yang membantumu merasa lebih aman dan tenang?", placeholder: "Orang, tempat, aktivitas, atau pikiran..." },
      ],
    },
  },
  {
    day: 7,
    title: "Kekuatan Dukungan",
    theme: "Hubungan Sosial",
    colorFrom: "#E8A4A4",
    colorTo: "#BF5A5A",
    edukasi: {
      title: "Kamu Tidak Sendirian",
      content: [
        "Salah satu sumber kekuatan terbesar dalam perjalanan penyembuhanmu adalah orang-orang yang mencintaimu. Dukungan sosial bukan hanya membuat hatimu terasa lebih hangat — penelitian menunjukkan bahwa dukungan sosial yang kuat dapat secara nyata meningkatkan hasil pengobatan.",
        "Kadang, orang-orang terdekatmu mungkin tidak tahu bagaimana cara terbaik untuk membantumu. Tidak apa-apa untuk memberitahu mereka apa yang kamu butuhkan — apakah itu kehadiran, bantuan praktis, atau cukup dengan didengarkan.",
        "Jika ada hari-hari di mana kamu merasa ingin menarik diri, itu juga wajar. Tetapi cobalah untuk tetap terhubung dengan satu orang yang kamu percaya, meski hanya melalui pesan singkat.",
        "Kelompok dukungan sesama pasien kanker juga bisa menjadi sumber kekuatan yang tak ternilai. Berbicara dengan seseorang yang benar-benar mengerti perjalananmu bisa memberikan perspektif dan harapan baru.",
      ],
      keyPoints: [
        "Dukungan sosial meningkatkan hasil pengobatan secara klinis",
        "Komunikasikan kebutuhanmu kepada orang-orang terdekat",
        "Tetap terhubung meski hanya melalui satu pesan singkat",
        "Kelompok dukungan sesama pasien sangat bermanfaat",
      ],
    },
    musik: {
      title: "Musik Hangat: Connection",
      description: "Dengarkan melodi yang hangat ini sambil membayangkan orang-orang yang mencintaimu mengelilingimu dengan kasih sayang. Rasakan kehangatan cinta mereka.",
      duration: 300,
      musicType: "Piano Hangat",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Aku dikelilingi oleh cinta dan dukungan. Aku tidak sendirian dalam perjalanan ini.",
      supportText: "Menerima bantuan adalah tanda kekuatan, bukan kelemahan.",
      instructions: "Pikirkan satu orang yang sangat mendukungmu. Ucapkan afirmasi ini sambil membayangkan wajahnya yang penuh kasih sayang.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Siapa yang paling mendukungmu hari ini, dan apa yang mereka lakukan?", placeholder: "Ceritakan tentang orang istimewa ini..." },
        { id: "q2", label: "Adakah bantuan yang ingin kamu minta namun belum kamu sampaikan?", placeholder: "Apa yang bisa orang lain lakukan untuk membantumu?" },
      ],
    },
  },
  {
    day: 8,
    title: "Nutrisi untuk Pemulihan",
    theme: "Kesehatan Fisik",
    colorFrom: "#A4E8B8",
    colorTo: "#3A9B6A",
    edukasi: {
      title: "Makan dengan Penuh Kasih",
      content: [
        "Nutrisi yang baik adalah salah satu cara terpenting untuk mendukung tubuhmu selama kemoterapi. Makan dengan baik membantu tubuhmu lebih toleran terhadap pengobatan, menjaga energi, dan mempercepat pemulihan.",
        "Protein sangat penting untuk memperbaiki jaringan tubuh dan mendukung sistem imun. Sumber protein yang baik termasuk telur, ikan, ayam, tahu, tempe, dan kacang-kacangan. Cobalah memasukkan protein di setiap waktu makan.",
        "Jika kamu mengalami mual, cobalah makanan dingin atau suhu ruang — aromanya lebih lemah dari makanan panas. Jahe, baik dalam teh atau makanan, terbukti membantu mengurangi mual.",
        "Minum cukup air sangat penting, terutama selama kemoterapi. Jika air putih terasa tidak menyenangkan, coba tambahkan irisan lemon, mentimun, atau daun mint untuk membuatnya lebih menarik.",
      ],
      keyPoints: [
        "Protein di setiap waktu makan penting untuk pemulihan",
        "Makanan dingin atau suhu ruang lebih mudah ditoleransi",
        "Jahe membantu mengurangi mual",
        "Hidrasi yang cukup sangat penting selama kemoterapi",
      ],
    },
    musik: {
      title: "Musik Alam: Morning Forest",
      description: "Dengarkan suara alam yang segar ini saat kamu minum air putih atau teh hangat. Bayangkan setiap tegukan membawa nutrisi dan kekuatan untuk tubuhmu.",
      duration: 300,
      musicType: "Suara Alam",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Setiap hal baik yang aku makan dan minum membantu tubuhku pulih dan kuat.",
      supportText: "Merawat tubuhmu dengan nutrisi adalah bentuk cinta pada dirimu.",
      instructions: "Bacalah afirmasi ini sebelum makan atau minum. Jadikan setiap makanan sebagai ritual kasih sayang untuk dirimu sendiri.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Apa yang kamu makan hari ini yang terasa baik untuk tubuhmu?", placeholder: "Ceritakan tentang makanan atau minumanmu hari ini..." },
        { id: "q2", label: "Adakah kesulitan dalam makan atau minum hari ini?", placeholder: "Bagaimana kamu mengatasinya?" },
      ],
    },
  },
  {
    day: 9,
    title: "Bergerak dengan Syukur",
    theme: "Aktivitas Fisik",
    colorFrom: "#C8E8A4",
    colorTo: "#78BF3A",
    edukasi: {
      title: "Gerakan Ringan yang Menyehatkan",
      content: [
        "Mungkin terdengar mengejutkan, tetapi aktivitas fisik ringan selama kemoterapi justru sangat dianjurkan. Gerakan ringan membantu mengurangi kelelahan, meningkatkan mood, dan bahkan dapat meningkatkan efektivitas pengobatan.",
        "Yang dimaksud 'ringan' di sini adalah benar-benar ringan — berjalan kaki selama 10-15 menit, melakukan peregangan lembut, atau yoga restoratif. Dengarkan tubuhmu dan berhenti ketika perlu.",
        "Peregangan lembut di pagi hari bisa menjadi ritual yang indah untuk memulai hari. Mulai dengan menggerakkan jari-jari tangan dan kaki, lalu perlahan-lahan ke bagian tubuh lainnya.",
        "Jangan pernah memaksakan diri. Pada hari-hari yang berat, bahkan duduk di kursi dan menggerakkan kaki sudah merupakan pencapaian yang luar biasa.",
      ],
      keyPoints: [
        "Aktivitas ringan mengurangi kelelahan dan meningkatkan mood",
        "10-15 menit jalan kaki sudah sangat bermanfaat",
        "Selalu dengarkan tubuhmu dan berhenti saat perlu",
        "Di hari berat, gerakan sekecil apapun sudah berarti",
      ],
    },
    musik: {
      title: "Musik Ceria Ringan: Gentle Movement",
      description: "Musik ini memiliki ritme yang lembut untuk menemanimu bergerak pelan. Kamu bisa melakukan peregangan ringan, atau sekadar menggerakkan jari-jarimu mengikuti irama.",
      duration: 300,
      musicType: "Musik Gerakan",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Tubuhku bergerak dengan penuh syukur. Setiap gerakan adalah hadiah.",
      supportText: "Menghargai kemampuan tubuhmu adalah bentuk rasa syukur yang indah.",
      instructions: "Sambil membaca afirmasi, gerakkan tanganmu perlahan — seperti mengalir mengikuti kata-kata. Rasakan kehadiran dan kemampuan tubuhmu.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Gerakan apa yang berhasil kamu lakukan hari ini, sekecil apapun?", placeholder: "Setiap gerakan adalah pencapaian yang layak dirayakan..." },
        { id: "q2", label: "Bagaimana tubuhmu terasa setelah bergerak?", placeholder: "Ceritakan sensasi yang kamu rasakan..." },
      ],
    },
  },
  {
    day: 10,
    title: "Mengelola Kelelahan",
    theme: "Manajemen Energi",
    colorFrom: "#E8D4A4",
    colorTo: "#BF9A3A",
    edukasi: {
      title: "Kelelahan yang Perlu Dipahami",
      content: [
        "Kelelahan akibat kanker (cancer-related fatigue) berbeda dari kelelahan biasa. Ini bukan hanya tentang kurang tidur — ini adalah kelelahan mendalam yang memengaruhi fisik, emosi, dan pikiran. Dan ini sangat wajar terjadi.",
        "Strategi penting: simpan energimu untuk hal-hal yang paling berarti bagimu. Buat prioritas, dan ijinkan dirimu untuk tidak melakukan semua hal yang biasanya kamu lakukan.",
        "Tidur yang berkualitas penting, namun tidur siang terlalu lama bisa mengganggu tidur malam. Cobalah membatasi tidur siang 20-30 menit, dan ciptakan rutinitas tidur yang konsisten.",
        "Minta bantuan untuk tugas-tugas yang menguras energi — memasak, berbelanja, membersihkan rumah. Menerima bantuan adalah hal yang cerdas dan penuh kasih pada dirimu sendiri.",
      ],
      keyPoints: [
        "Cancer-related fatigue berbeda dari kelelahan biasa",
        "Prioritaskan energimu untuk hal yang paling bermakna",
        "Batasi tidur siang 20-30 menit untuk kualitas tidur malam",
        "Minta bantuan untuk aktivitas yang menguras energi",
      ],
    },
    musik: {
      title: "Musik Tidur Siang: Nap Time",
      description: "Jika kamu lelah, tutuplah matamu dan biarkan musik ini membawamu ke istirahat singkat yang menyegarkan. Ijinkan dirimu untuk beristirahat tanpa rasa bersalah.",
      duration: 300,
      musicType: "Ambient Tenang",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Aku mengijinkan diriku untuk beristirahat. Istirahat adalah bagian dari penyembuhanku.",
      supportText: "Beristirahat bukan kelemahan — itu kebijaksanaan.",
      instructions: "Ucapkan afirmasi ini dengan penuh izin dan kasih sayang pada dirimu. Tidak ada rasa bersalah dalam beristirahat.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Pada skala 1-10, seberapa lelah kamu hari ini? Dan apa yang paling melelahkan?", placeholder: "Ceritakan tentang tingkat kelelahanmu..." },
        { id: "q2", label: "Apa yang berhasil kamu lakukan meskipun merasa lelah?", placeholder: "Setiap pencapaian kecil sangat berarti..." },
      ],
    },
  },
  {
    day: 11,
    title: "Mindfulness: Hadir Saat Ini",
    theme: "Kesadaran Penuh",
    colorFrom: "#A4C4E8",
    colorTo: "#4A7FB0",
    edukasi: {
      title: "Seni Hadir di Momen Ini",
      content: [
        "Mindfulness adalah kemampuan untuk hadir sepenuhnya di momen saat ini — tanpa menghakimi, tanpa memikirkan masa lalu atau masa depan. Ini adalah keterampilan yang bisa dilatih, dan sangat bermanfaat bagi pasien kanker.",
        "Penelitian menunjukkan bahwa praktik mindfulness secara teratur dapat mengurangi kecemasan, depresi, dan nyeri pada pasien kanker, serta meningkatkan kualitas tidur dan kesejahteraan secara keseluruhan.",
        "Kamu tidak perlu meditasi panjang untuk merasakan manfaatnya. Bahkan 5 menit sehari hadir dengan penuh kesadaran sudah memberikan perubahan yang nyata.",
        "Cobalah 'mindful eating': makan dengan perlahan, perhatikan rasa, tekstur, dan aroma makananmu. Atau 'mindful walking': perhatikan setiap langkah, sensasi kaki menyentuh tanah, dan udara yang kamu hirup.",
      ],
      keyPoints: [
        "Mindfulness terbukti mengurangi kecemasan dan depresi pada pasien kanker",
        "5 menit sehari sudah memberi perubahan yang nyata",
        "Mindful eating: makan perlahan dengan penuh perhatian",
        "Mindful walking: hadir dalam setiap langkah",
      ],
    },
    musik: {
      title: "Panduan Mindfulness: Tibetan Bowls",
      description: "Suara mangkuk Tibet ini akan memandumu untuk hadir di momen ini. Fokuskan perhatianmu pada suara, biarkan pikiran datang dan pergi seperti awan di langit.",
      duration: 300,
      musicType: "Panduan Mindfulness",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Aku hadir di momen ini dengan penuh kasih dan penerimaan diri.",
      supportText: "Momen ini adalah satu-satunya yang perlu kamu tangani sekarang.",
      instructions: "Sebelum membaca afirmasi, ambil napas dalam, dan sadari ruang di sekitarmu. Lalu ucapkan dengan penuh kehadiran.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Momen apa hari ini yang benar-benar kamu rasakan secara penuh dan hadir?", placeholder: "Sebuah percakapan, pemandangan, rasa, atau sensasi..." },
        { id: "q2", label: "Apa yang ingin kamu bawa lebih banyak ke dalam hidupmu?", placeholder: "Pikiran, perasaan, atau pengalaman..." },
      ],
    },
  },
  {
    day: 12,
    title: "Strategi Menghadapi Emosi",
    theme: "Koping Positif",
    colorFrom: "#E8A4C8",
    colorTo: "#B05080",
    edukasi: {
      title: "Strategi Koping yang Sehat",
      content: [
        "Menghadapi kanker adalah salah satu tantangan emosional terbesar yang bisa dialami seseorang. Wajar jika kamu merasakan berbagai emosi yang kadang terasa membingungkan atau sangat intens.",
        "Strategi koping yang sehat termasuk: mengekspresikan emosi melalui tulisan atau seni, berbicara dengan orang yang dipercaya, berolahraga ringan, praktik relaksasi seperti yang telah kita pelajari, dan mencari makna dalam pengalaman.",
        "Hindari strategi yang tidak sehat seperti menyangkal perasaan, mengisolasi diri, atau mengalihkan dengan hal-hal yang merugikan. Perasaan yang tidak diproses akan terus mencari jalan keluarnya.",
        "Ingat: meminta bantuan profesional — psikolog atau konselor — adalah tanda kekuatan dan kebijaksanaan. Kamu tidak harus mengatasi semua ini sendirian.",
      ],
      keyPoints: [
        "Ekspresikan emosi melalui tulisan, seni, atau percakapan",
        "Praktik relaksasi adalah strategi koping yang terbukti efektif",
        "Hindari menyangkal perasaan — proses dengan sehat",
        "Bantuan profesional adalah pilihan yang bijak dan kuat",
      ],
    },
    musik: {
      title: "Musik Emosional: Healing Heart",
      description: "Musik ini dirancang untuk membantumu merasakan dan melepaskan emosi yang tersimpan. Jika ada air mata yang mengalir, biarkan saja — itu adalah bentuk penyembuhan.",
      duration: 300,
      musicType: "Musik Emosional",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Aku mampu merasakan dan melewati setiap emosi dengan bijak dan penuh kasih.",
      supportText: "Emosi yang kamu rasakan adalah valid dan berhak untuk diproses.",
      instructions: "Ucapkan afirmasi ini kepada dirimu dengan penuh penerimaan. Tidak ada emosi yang terlalu besar atau terlalu kecil.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Emosi apa yang paling kuat kamu rasakan hari ini?", placeholder: "Deskripsikan emosi tersebut dengan kata-katamu sendiri..." },
        { id: "q2", label: "Bagaimana kamu merespons emosi tersebut? Apakah ada cara yang lebih baik yang ingin kamu coba?", placeholder: "Refleksikan cara kamu menghadapi emosimu..." },
      ],
    },
  },
  {
    day: 13,
    title: "Makna dan Harapan",
    theme: "Spiritual & Makna",
    colorFrom: "#D4A4E8",
    colorTo: "#7A4AAF",
    edukasi: {
      title: "Menemukan Makna dalam Perjalanan",
      content: [
        "Banyak pasien kanker menemukan bahwa perjalanan pengobatan mereka, meski menyakitkan, membawa mereka untuk menemukan kembali apa yang benar-benar bermakna dalam hidup. Ini adalah pertumbuhan pasca-trauma yang nyata.",
        "Makna tidak harus besar atau filosofis. Bisa sesederhana: tawa bersama orang tersayang, keindahan matahari terbenam, secangkir teh hangat di pagi hari, atau rasa syukur atas napas yang masih ada.",
        "Harapan bukan berarti menyangkal kenyataan. Harapan adalah kemampuan untuk percaya bahwa ada kemungkinan baik di masa depan, sambil tetap hadir di saat ini.",
        "Apa yang paling berarti bagimu? Apa yang ingin kamu alami, rasakan, atau berikan kepada orang-orang yang kamu cintai? Pertanyaan-pertanyaan ini bisa menjadi kompas yang memandumu di hari-hari yang sulit.",
      ],
      keyPoints: [
        "Banyak pasien menemukan makna baru dalam perjalanan pengobatan",
        "Makna bisa ditemukan dalam hal-hal kecil sehari-hari",
        "Harapan adalah percaya pada kemungkinan baik, bukan menyangkal kenyataan",
        "Nilai-nilai pribadimu adalah kompas di hari-hari yang sulit",
      ],
    },
    musik: {
      title: "Musik Spiritual: Hope",
      description: "Biarkan melodi yang mengangkat ini membantumu terhubung dengan harapan yang ada dalam dirimu. Bayangkan cahaya terang yang menuntunmu ke depan.",
      duration: 300,
      musicType: "Musik Inspiratif",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Hidupku penuh makna dan harapan yang indah. Aku percaya pada perjalananku.",
      supportText: "Harapanmu adalah nyala api yang tidak bisa dipadamkan.",
      instructions: "Tutup matamu, bayangkan dirimu di masa depan yang baik, lalu ucapkan afirmasi ini dengan keyakinan yang tulus.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Apa yang paling bermakna bagimu dalam hidupmu saat ini?", placeholder: "Siapa atau apa yang memberi hidupmu makna terdalam?" },
        { id: "q2", label: "Apa harapanmu untuk masa depan, sekecil apapun itu?", placeholder: "Tuliskan harapanmu dengan bebas..." },
      ],
    },
  },
  {
    day: 14,
    title: "Merayakan Kemajuanku",
    theme: "Apresiasi Diri",
    colorFrom: "#E8E4A4",
    colorTo: "#B0A83A",
    edukasi: {
      title: "Kamu Telah Melangkah Sejauh Ini",
      content: [
        "Kamu hampir menyelesaikan program 15 hari ini — dan itu adalah pencapaian yang luar biasa! Di tengah semua yang sedang kamu hadapi, kamu masih meluangkan waktu untuk merawat kesehatan pikiranmu. Itu bukan hal kecil.",
        "Perlu waktu untuk menyadari dan menghargai kemajuan yang telah kamu buat. Mungkin kemajuan itu terasa halus — tidur yang sedikit lebih baik, pikiran yang sedikit lebih tenang, atau satu momen di mana kamu merasa percaya diri.",
        "Merayakan pencapaian, sekecil apapun, adalah cara yang sangat efektif untuk memperkuat perilaku positif dan memotivasi dirimu untuk terus maju. Otak kita merespons penghargaan dengan sangat baik.",
        "Pikirkan bagaimana kamu ingin merayakan menyelesaikan program ini. Mungkin dengan makan makanan favoritmu, melakukan sesuatu yang menyenangkan, atau sekadar memberitahu orang yang kamu cintai tentang pencapaianmu.",
      ],
      keyPoints: [
        "Menyelesaikan program ini adalah pencapaian luar biasa",
        "Kemajuan bisa terasa halus namun nyata",
        "Merayakan pencapaian kecil memperkuat perilaku positif",
        "Rencanakan cara merayakan pencapaianmu yang luar biasa",
      ],
    },
    musik: {
      title: "Musik Perayaan Tenang: Celebration",
      description: "Musik yang penuh kehangatan dan apresiasi ini adalah untukmu — untuk merayakan setiap langkah yang telah kamu ambil. Kamu pantas untuk dirayakan.",
      duration: 300,
      musicType: "Musik Perayaan",
    },
    afirmasi: {
      title: "Afirmasi Hari Ini",
      mainText: "Aku bangga dengan setiap langkah yang telah aku tempuh. Aku layak dirayakan.",
      supportText: "Kemajuanmu nyata dan berharga, meski tidak selalu terlihat.",
      instructions: "Ucapkan afirmasi ini sambil tersenyum pada dirimu sendiri. Kamu benar-benar layak mendapat penghargaan ini.",
    },
    refleksi: {
      title: "Refleksi Hari Ini",
      questions: [
        { id: "q1", label: "Apa perubahan terbesar yang kamu rasakan dalam dirimu selama 14 hari program ini?", placeholder: "Perubahan pikiran, perasaan, atau cara pandang..." },
        { id: "q2", label: "Apa yang ingin kamu rayakan dari dirimu hari ini?", placeholder: "Kamu layak untuk dirayakan..." },
      ],
    },
  },
  {
    day: 15,
    title: "Aku Adalah Pejuang Sejati",
    theme: "Penutupan & Komitmen",
    colorFrom: "#E8A4C8",
    colorTo: "#C96B8A",
    edukasi: {
      title: "Perjalananmu Adalah Kekuatanmu",
      content: [
        "Selamat! Kamu telah menyelesaikan program 15 hari SNEfi Care. Ini adalah pencapaian yang luar biasa, dan kamu patut bangga setulus-tulusnya.",
        "Selama 15 hari ini, kamu telah belajar tentang tubuh dan emosimu, melatih pernapasan dan mindfulness, mempraktikkan afirmasi positif, dan mengekspresikan dirimu melalui refleksi. Semua keterampilan ini sekarang adalah milikmu.",
        "Perjalananmu tidak berakhir di sini. Kamu kini memiliki seperangkat alat yang bisa kamu gunakan kapan saja kamu membutuhkan — ketika kecemasan datang, ketika tubuhmu lelah, ketika hatimu butuh penguatan.",
        "Teruslah berjuang, teruslah berharap, dan teruslah mencintai dirimu sendiri dengan sepenuh hati. Kamu adalah pejuang sejati — kuat, berani, dan layak mendapat semua kebaikan yang ada di dunia ini.",
      ],
      keyPoints: [
        "Kamu telah menyelesaikan program 15 hari — sebuah pencapaian luar biasa",
        "Semua keterampilan yang dipelajari adalah milikmu untuk selamanya",
        "Gunakan alat-alat ini kapan saja kamu membutuhkan",
        "Perjalananmu adalah inspirasi bagi orang lain",
      ],
    },
    musik: {
      title: "Musik Penutup: Journey Complete",
      description: "Dengarkan musik yang penuh keagungan dan kehangatan ini sebagai tanda selesainya perjalanan 15 harimu. Rasakan rasa syukur dan kebanggaan yang mengalir dalam dirimu.",
      duration: 300,
      musicType: "Musik Penutup",
    },
    afirmasi: {
      title: "Afirmasi Penutup",
      mainText: "Aku adalah pejuang yang kuat, penuh kasih, dan layak mendapat semua kebaikan.",
      supportText: "Kamu telah membuktikan pada dirimu sendiri bahwa kamu mampu.",
      instructions: "Ucapkan afirmasi ini dengan segenap hatimu. Ini bukan sekadar kata-kata — ini adalah kebenaranmu.",
    },
    refleksi: {
      title: "Refleksi Akhir",
      questions: [
        { id: "q1", label: "Apa pelajaran terbesar yang kamu bawa dari perjalanan 15 hari ini?", placeholder: "Apa yang paling bermakna dari program ini untukmu?" },
        { id: "q2", label: "Apa komitmenmu untuk terus merawat kesehatan pikiranmu ke depan?", placeholder: "Tuliskan komitmenmu kepada dirimu sendiri..." },
      ],
    },
  },
];

export const patients: Patient[] = [
  {
    id: "p000",
    name: "Demo Pasien",
    age: 45,
    diagnosis: "Kanker Payudara (akun uji coba)",
    chemoCycle: "Siklus 1 dari 6",
    startDate: "2026-04-01",
    currentDay: 1,
    username: "demo.pasien",
    password: "demo123",
    phone: "0800-0000-0000",
    sessions: [],
  },
  {
    id: "p099",
    name: "Demo Post-test",
    age: 45,
    diagnosis: "Kanker Payudara (akun uji post-test)",
    chemoCycle: "Siklus 6 dari 6",
    startDate: "2026-02-15",
    currentDay: 15,
    username: "demo.post",
    password: "post123",
    phone: "0800-0000-0099",
    sessions: demoPostTestSessions(),
  },
  {
    id: "p001",
    name: "Siti Rahayu",
    age: 47,
    diagnosis: "Kanker Payudara Stadium II",
    chemoCycle: "Siklus 3 dari 6",
    startDate: "2026-02-10",
    currentDay: 8,
    username: "siti.rahayu",
    password: "siti123",
    phone: "0812-3456-7890",
    sessions: [
      {
        day: 1,
        status: "selesai",
        completedAt: "2026-02-10T09:30:00",
        durationMinutes: 32,
        mood: 3,
        refleksiAnswers: {
          q1: "Hari ini cukup berat, tapi saya merasa ada harapan setelah membaca program ini.",
          q2: "Saya bersyukur masih bisa bangun pagi dan melihat anak-anak saya.",
        },
        afirmasiNote: "Saya mengucapkan afirmasi dengan suara pelan namun terasa menyentuh.",
        // Contoh rekaman afirmasi yang dapat diputar perawat
        affirmationAudioUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav",
      }, 
      { day: 2, status: "selesai", completedAt: "2026-02-11T10:15:00", durationMinutes: 28, mood: 3, refleksiAnswers: { q1: "Melihat cermin masih terasa berat. Tapi saya coba menerimanya.", q2: "Terima kasih tubuhku sudah berjuang dengan begitu keras." }, afirmasiNote: "Awalnya sulit, tapi semakin diulang semakin terasa nyaman." },
      { day: 3, status: "selesai", completedAt: "2026-02-12T08:45:00", durationMinutes: 35, mood: 2, refleksiAnswers: { q1: "Mual sangat parah hari ini. Tapi minum jahe sedikit membantu.", q2: "Tidur sebentar dan memandang foto keluarga membantu saya." }, afirmasiNote: "Saya mengulangi afirmasi saat mual datang dan rasanya sedikit membantu." },
      { day: 4, status: "selesai", completedAt: "2026-02-13T09:00:00", durationMinutes: 30, mood: 4, refleksiAnswers: { q1: "Latihan pernapasan terasa sangat menenangkan. Saya merasa lebih ringan.", q2: "Saat cemas malam tadi, saya coba teknik 4-7-8 dan berhasil tidur." }, afirmasiNote: "" },
      { day: 5, status: "selesai", completedAt: "2026-02-14T11:30:00", durationMinutes: 27, mood: 4, refleksiAnswers: { q1: "Suami bilang saya tetap cantik dan itu membuat saya menangis bahagia.", q2: "Besok saya ingin memakai pakaian warna cerah." }, afirmasiNote: "Saya berdiri di depan cermin dan berkata afirmasi. Pertama kali dalam lama." },
      { day: 6, status: "selesai", completedAt: "2026-02-15T09:20:00", durationMinutes: 33, mood: 3, refleksiAnswers: { q1: "Cemas tentang hasil lab minggu depan. Tapi saya coba tidak memikirkannya terus.", q2: "Berjalan di taman kecil dan menyentuh tanaman." }, afirmasiNote: "Saya ucapkan afirmasi saat kecemasan datang malam ini." },
      { day: 7, status: "selesai", completedAt: "2026-02-16T10:00:00", durationMinutes: 29, mood: 5, refleksiAnswers: { q1: "Anak perempuan saya datang dari luar kota untuk menemani. Sangat bahagia.", q2: "Saya ingin minta tolong untuk memasak karena tubuh belum kuat." }, afirmasiNote: "Mengucapkan sambil memegang foto keluarga." },
    ],
  },
  {
    id: "p002",
    name: "Nur Indah Permata",
    age: 39,
    diagnosis: "Kanker Payudara Stadium I",
    chemoCycle: "Siklus 2 dari 4",
    startDate: "2026-02-17",
    currentDay: 5,
    username: "nur.indah",
    password: "nur123",
    phone: "0813-5678-9012",
    sessions: [
      { day: 1, status: "selesai", completedAt: "2026-02-17T08:00:00", durationMinutes: 25, mood: 4, refleksiAnswers: { q1: "Perasaan saya campur aduk, tapi program ini memberi saya harapan.", q2: "Cuaca cerah hari ini dan tanaman di depan rumah sedang berbunga." }, afirmasiNote: "Terasa sedikit aneh awalnya, tapi saya suka." },
      { day: 2, status: "selesai", completedAt: "2026-02-18T09:30:00", durationMinutes: 22, mood: 3, refleksiAnswers: { q1: "Masih berjuang menerima perubahan tubuh. Ini proses.", q2: "Kamu sudah berjuang keras, tubuhku. Terima kasih." }, afirmasiNote: "Saya pegang dada saya dan ucapkan afirmasi. Terharu." },
      { day: 3, status: "selesai", completedAt: "2026-02-19T10:15:00", durationMinutes: 30, mood: 3, refleksiAnswers: { q1: "Rambut mulai rontok banyak. Tapi saya sudah siapkan mental.", q2: "Teh jahe hangat dan suami di samping saya." }, afirmasiNote: "" },
      { day: 4, status: "selesai", completedAt: "2026-02-20T08:45:00", durationMinutes: 28, mood: 5, refleksiAnswers: { q1: "Latihan napas 4-7-8 sangat membantu! Saya tidur lebih nyenyak.", q2: "Saat panik setelah check-up, napas dalam membantu saya tenang." }, afirmasiNote: "Saya suka sekali afirmasi hari ini." },
    ],
  },
  {
    id: "p003",
    name: "Dewi Lestari Kusuma",
    age: 52,
    diagnosis: "Kanker Payudara Stadium III",
    chemoCycle: "Siklus 5 dari 6",
    startDate: "2026-02-04",
    currentDay: 12,
    username: "dewi.lestari",
    password: "dewi123",
    phone: "0814-9012-3456",
    sessions: [
      { day: 1, status: "selesai", completedAt: "2026-02-04T10:00:00", durationMinutes: 35, mood: 2, refleksiAnswers: { q1: "Hari yang berat. Badan sangat lemah.", q2: "Masih bisa melihat anak cucu." }, afirmasiNote: "" },
      { day: 2, status: "selesai", completedAt: "2026-02-05T09:15:00", durationMinutes: 30, mood: 3, refleksiAnswers: { q1: "Mulai bisa menerima kondisi tubuh, pelan-pelan.", q2: "Terima kasih tubuh yang masih kuat berjuang." }, afirmasiNote: "Pelan tapi terasa menyentuh." },
      { day: 3, status: "selesai", completedAt: "2026-02-06T08:30:00", durationMinutes: 28, mood: 2, refleksiAnswers: { q1: "Mual sangat parah, hampir tidak bisa ikut sesi.", q2: "Perawat yang ramah sangat membantu hari ini." }, afirmasiNote: "" },
      { day: 4, status: "selesai", completedAt: "2026-02-07T11:00:00", durationMinutes: 32, mood: 3, refleksiAnswers: { q1: "Napas dalam sedikit mengurangi rasa sakit.", q2: "Saat nyeri datang malam, napas pelan membantu." }, afirmasiNote: "" },
      { day: 5, status: "selesai", completedAt: "2026-02-08T09:45:00", durationMinutes: 25, mood: 4, refleksiAnswers: { q1: "Cucu bilang nenek cantik, membuat saya menangis bahagia.", q2: "Mau pakai jilbab warna pink besok." }, afirmasiNote: "Saya ucapkan sambil pegang foto cucu." },
      { day: 6, status: "selesai", completedAt: "2026-02-09T10:30:00", durationMinutes: 27, mood: 3, refleksiAnswers: { q1: "Khawatir tentang stadium penyakit. Tapi coba tenang.", q2: "Berdoa dan baca Al-Quran membantu ketenangan saya." }, afirmasiNote: "" },
      { day: 7, status: "selesai", completedAt: "2026-02-10T09:00:00", durationMinutes: 33, mood: 5, refleksiAnswers: { q1: "Semua anak datang berkumpul. Sangat bahagia dan terharu.", q2: "Minta bantu masak dan bersih-bersih." }, afirmasiNote: "Mengucapkan bersama anak-anak." },
      { day: 8, status: "selesai", completedAt: "2026-02-11T10:00:00", durationMinutes: 29, mood: 3, refleksiAnswers: { q1: "Makan bubur dan teh jahe, bisa masuk.", q2: "Sedikit sulit minum cukup air, tapi sudah lebih baik." }, afirmasiNote: "" },
      { day: 9, status: "selesai", completedAt: "2026-02-12T09:30:00", durationMinutes: 26, mood: 4, refleksiAnswers: { q1: "Berjalan 5 menit di sekitar rumah, sudah besar artinya.", q2: "Ringan dan sedikit segar setelah gerak kecil." }, afirmasiNote: "Sambil bergerak pelan, terasa menyenangkan." },
      { day: 10, status: "selesai", completedAt: "2026-02-13T11:30:00", durationMinutes: 24, mood: 2, refleksiAnswers: { q1: "Sangat lelah hari ini, 8/10. Setelah kemo kelima.", q2: "Berhasil makan sedikit dan minum teh jahe." }, afirmasiNote: "" },
      { day: 11, status: "selesai", completedAt: "2026-02-14T10:00:00", durationMinutes: 31, mood: 4, refleksiAnswers: { q1: "Saat minum teh pagi, saya benar-benar hadir dan merasakan kehangatannya.", q2: "Lebih banyak ketenangan dan penerimaan." }, afirmasiNote: "Saya ucapkan sambil menutup mata dan benar-benar merasakannya." },
    ],
  },
];

export const nurses: Nurse[] = [
  { id: "n001", name: "Ns. Kartini Dewi, S.Kep", nip: "198504152010012001", department: "Onkologi", username: "ns.kartini", password: "kartini123" },
  { id: "n002", name: "Ns. Budi Santoso, S.Kep", nip: "198801202011011002", department: "Onkologi", username: "ns.budi", password: "budi123" },
];