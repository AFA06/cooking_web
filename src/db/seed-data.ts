import type { Recipe, RecipeIngredient, RecipeStep, RecipeMedia, RecipeCreator } from "@/types/recipe";

export const CREATORS: RecipeCreator[] = [
  {
    id: "c1",
    name: "Aziza oshxonasi",
    slug: "aziza-oshxonasi",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
    bio: "Avloddan avlodga o‘tib kelgan o‘zbek taomlari. Uy oshxonasini hamma uchun yaqin qilamiz.",
    isFoundingCreator: true,
    socialLinks: {},
  },
  {
    id: "c2",
    name: "Bekzod pazanda",
    slug: "bekzod-pazanda",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    bio: "Markaziy Osiyo klassikalari zamonaviy talqinda. Restoran sirlarini uy oshpazlari bilan bo‘lishaman.",
    isFoundingCreator: true,
    socialLinks: {},
  },
  {
    id: "c3",
    name: "Feruza dasturxoni",
    slug: "feruza-dasturxoni",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80",
    bio: "Go‘shtsiz va yengil o‘zbek taomlari. O‘simlik asosidagi ovqat ham to‘yimli va mazali bo‘lishi mumkin.",
    isFoundingCreator: true,
    socialLinks: {},
  },
];

const IMG = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

const PHOTOS = {
  plov: "1603133872878-684f208fb84b",
  lagman: "1569718212165-3a8278d5f624",
  rice: "1512621776951-a57141f2eefd",
  onions: "1504674900247-0877df9cc836",
  veg: "1592417817098-8fd3d9eb14a5",
  dumplings: "1496116218417-1a781b1c416c",
  soup: "1547592166-23ac45744acd",
  skewers: "1599487488170-d11ec9c172f0",
  platter: "1601050690597-df0568f70950",
  pasta: "1551183053-bf91a1d81141",
};

function ing(rows: [string, string, string][]): RecipeIngredient[] {
  return rows.map(([name, quantity, unit], i) => ({ id: `i${i + 1}`, name, quantity, unit, order: i + 1 }));
}

type StepInput = {
  title: string;
  instruction: string;
  photo?: string;
  minutes?: number;
  celsius?: number;
  tip?: string;
  uses?: number[];
};

function steps(rows: StepInput[]): RecipeStep[] {
  return rows.map((r, i) => ({
    id: `s${i + 1}`,
    order: i + 1,
    title: r.title,
    instruction: r.instruction,
    mediaUrl: r.photo ? IMG(r.photo, 800) : undefined,
    mediaType: r.photo ? ("image" as const) : undefined,
    timerSeconds: r.minutes ? r.minutes * 60 : undefined,
    temperatureCelsius: r.celsius,
    tip: r.tip,
    ingredientIds: (r.uses ?? []).map((n) => `i${n}`),
  }));
}

function cover(photo: string, alt: string): RecipeMedia {
  return { id: "m1", type: "image", url: IMG(photo), alt, order: 1 };
}

const PUBLISHED = "2026-09-01T10:00:00Z";

export const RECIPES: Recipe[] = [
  {
    id: "1",
    slug: "klassik-osh",
    title: "Klassik o‘zbek oshi",
    description: "Xushbo‘y guruch, yumshoq qo‘y go‘shti, shirin sabzi va zira — bayram dasturxonining tojidir.",
    coverMedia: cover(PHOTOS.plov, "Lagan idishda o‘zbek oshi"),
    creator: CREATORS[0],
    servings: 6,
    prepTimeMinutes: 30,
    cookTimeMinutes: 100,
    difficulty: "medium",
    isPremium: true,
    price: 15000,
    currency: "UZS",
    ingredients: ing([
      ["Devzira yoki uzun donli guruch", "3", "stakan"],
      ["Qo‘y go‘shti (kurak)", "500", "g"],
      ["Sabzi", "3", "ta katta"],
      ["Piyoz", "2", "ta katta"],
      ["Sarimsoq", "1", "bosh"],
      ["Zira", "1", "osh qoshiq"],
      ["Tuz", "1.5", "osh qoshiq"],
      ["O‘simlik yog‘i", "150", "ml"],
    ]),
    steps: steps([
      { title: "Masalliqlarni tayyorlang", instruction: "Guruchni suvi tiniq bo‘lguncha yuving va tuzli sovuq suvda ivitib qo‘ying. Sabzini ingichka somon qilib to‘g‘rang, piyozni yarim halqa qilib to‘g‘rang, go‘shtni bo‘laklang.", photo: PHOTOS.veg, tip: "Guruch ivitilsa, donlari butun va bir-biridan ajralgan holda qoladi.", uses: [1, 2, 3, 4] },
      { title: "Piyozni qovuring", instruction: "Qozonda yog‘ni qizdiring. Piyozni soling va o‘rtacha olovda to‘q tillarang tusga kirguncha qovuring.", photo: PHOTOS.onions, minutes: 7, celsius: 180, tip: "Tillarang piyoz — yaxshi oshning asosiy ta’mi.", uses: [4, 8] },
      { title: "Go‘shtni qizartiring", instruction: "Go‘shtni soling, olovni kuchaytiring va hamma tomonini qizartiring. Qozonni to‘ldirib yubormang.", minutes: 5, celsius: 200, tip: "Go‘shtni oldindan quriting — shunda qizaradi, bug‘lanib qolmaydi.", uses: [2] },
      { title: "Sabzi va ziravorlarni qo‘shing", instruction: "Sabzini qo‘shib 3 daqiqa qovuring, so‘ng zira va tuzni soling hamda hidi kelguncha aralashtiring.", minutes: 4, uses: [3, 6, 7] },
      { title: "Zirvakni damlang", instruction: "4 stakan qaynoq suv quying, butun sarimsoqni o‘rtaga qo‘ying va yopiq holda past olovda damlang.", photo: PHOTOS.soup, minutes: 30, celsius: 100, tip: "Zirvak sal sho‘rroq bo‘lishi kerak — guruch tuzni tortib oladi.", uses: [5] },
      { title: "Guruchni soling", instruction: "Guruchni suzib, go‘sht ustiga tekis yoying. Aralashtirmang. Guruch ustidan bir barmoq balandlikda suv quying va qaynating.", photo: PHOTOS.rice, minutes: 5, uses: [1] },
      { title: "Dam bering", instruction: "Guruchni uyum qilib yig‘ing, qoshiq sopi bilan teshiklar oching, qopqoqni mahkam yoping va eng past olovda pishiring. Qopqoqni ochmang.", minutes: 20, celsius: 90, tip: "Keyin qozonni olovdan olib, 15 daqiqa dam oldiring." },
      { title: "Aralashtiring va torting", instruction: "Sarimsoqni oling, guruchni go‘sht va sabzi bilan ehtiyotkorlik bilan aralashtiring va katta laganga torting.", photo: PHOTOS.plov, tip: "Achchiq-chuchuk salat va issiq choy bilan tortiladi." },
    ]),
    media: [cover(PHOTOS.plov, "Lagan idishda o‘zbek oshi")],
    tags: ["O‘zbek", "Guruch", "Qo‘y go‘shti", "An’anaviy"],
    publishedAt: PUBLISHED,
    cookedCount: 0,
    rating: { average: 0, count: 0 },
  },
  {
    id: "2",
    slug: "lagmon-qolda-tortilgan",
    title: "Lag‘mon — qo‘lda tortilgan",
    description: "Mol go‘shti va sabzavotli quyuq sho‘rva ichida ipakdek tortilgan lag‘mon. Har bir tortishga arziydi.",
    coverMedia: cover(PHOTOS.lagman, "Go‘sht va sabzavotli lag‘mon"),
    creator: CREATORS[1],
    servings: 4,
    prepTimeMinutes: 45,
    cookTimeMinutes: 60,
    difficulty: "hard",
    isPremium: true,
    price: 20000,
    currency: "UZS",
    ingredients: ing([
      ["Un", "500", "g"],
      ["Mol go‘shti", "400", "g"],
      ["Piyoz", "1", "ta katta"],
      ["Bolgar qalampiri", "2", "ta"],
      ["Tomat pastasi", "2", "osh qoshiq"],
      ["Sarimsoq", "4", "ho‘l"],
      ["Tuz", "2", "choy qoshiq"],
      ["O‘simlik yog‘i", "80", "ml"],
    ]),
    steps: steps([
      { title: "Xamir qoring", instruction: "Un va 200 ml tuzli suvdan qattiq xamir qoring. Yopib, 30 daqiqa dam oldiring.", minutes: 30, uses: [1, 7] },
      { title: "Go‘shtni qovuring", instruction: "Yog‘ni qizdirib, to‘g‘ralgan mol go‘shtini piyoz bilan baland olovda qizartiring.", photo: PHOTOS.onions, minutes: 10, uses: [2, 3, 8] },
      { title: "Sho‘rva tayyorlang", instruction: "Qalampir, sarimsoq va tomat pastasini qo‘shing, suv quying va go‘sht yumshaguncha past olovda pishiring.", photo: PHOTOS.soup, minutes: 40, uses: [4, 5, 6] },
      { title: "Lag‘monni torting", instruction: "Xamirni arqonlarga aylantiring, yog‘lang, so‘ng cho‘zib, buklab ingichka ipga aylantiring.", tip: "Xamir qaytib qisqarsa, 10 daqiqa dam bering." },
      { title: "Qaynatib torting", instruction: "Lag‘monni 3 daqiqa qaynatib suzing va ustiga sho‘rvani quying.", photo: PHOTOS.lagman, minutes: 3 },
    ]),
    media: [cover(PHOTOS.lagman, "Go‘sht va sabzavotli lag‘mon")],
    tags: ["O‘zbek", "Lag‘mon", "Mol go‘shti", "Sho‘rva"],
    publishedAt: PUBLISHED,
    cookedCount: 0,
    rating: { average: 0, count: 0 },
  },
  {
    id: "3",
    slug: "manti-bugda-pishgan",
    title: "Manti — bug‘da pishirilgan",
    description: "Qo‘y go‘shti va piyozli sersuv manti: qo‘lda tugib, bug‘da yumshoq qilib pishiriladi.",
    coverMedia: cover(PHOTOS.dumplings, "Yog‘och likopchada manti"),
    creator: CREATORS[0],
    servings: 4,
    prepTimeMinutes: 60,
    cookTimeMinutes: 40,
    difficulty: "medium",
    isPremium: true,
    price: 12000,
    currency: "UZS",
    ingredients: ing([
      ["Un", "500", "g"],
      ["Qiyma (qo‘y go‘shti)", "500", "g"],
      ["Piyoz", "3", "ta katta"],
      ["Tuz", "2", "choy qoshiq"],
      ["Qora murch", "1", "choy qoshiq"],
      ["Saryog‘", "50", "g"],
    ]),
    steps: steps([
      { title: "Xamir qoring", instruction: "Un, suv va bir chimdim tuzdan qattiq xamir qoring. 30 daqiqa dam oldiring.", minutes: 30, uses: [1] },
      { title: "Ichini tayyorlang", instruction: "Piyozni mayda to‘g‘rang va qiyma, tuz, murch bilan aralashtiring.", uses: [2, 3, 4, 5], tip: "Qo‘lda to‘g‘ralgan piyoz ichini sersuv qiladi." },
      { title: "Mantini tuging", instruction: "Xamirni yupqa yoying, kvadratlarga kesing, ichini soling va burchaklarini tugib biriktiring.", photo: PHOTOS.dumplings },
      { title: "Bug‘da pishiring", instruction: "Mantini yog‘langan mantixonaga joylang va qaynayotgan suv bug‘ida pishiring.", minutes: 40, celsius: 100 },
      { title: "Tortish", instruction: "Erigan saryog‘ surting va issiq holda torting.", uses: [6] },
    ]),
    media: [cover(PHOTOS.dumplings, "Yog‘och likopchada manti")],
    tags: ["O‘zbek", "Manti", "Qo‘y go‘shti"],
    publishedAt: PUBLISHED,
    cookedCount: 0,
    rating: { average: 0, count: 0 },
  },
  {
    id: "4",
    slug: "somsa-qatlamali",
    title: "Somsa — qatlamali go‘shtli",
    description: "Tillarang, qatlam-qatlam, qo‘y go‘shti va piyozli xushbo‘y ichli somsa. Tandirsiz, duxovkada.",
    coverMedia: cover(PHOTOS.platter, "Tilla rang pishgan somsalar"),
    creator: CREATORS[1],
    servings: 8,
    prepTimeMinutes: 45,
    cookTimeMinutes: 35,
    difficulty: "medium",
    isPremium: false,
    ingredients: ing([
      ["Tayyor qatlamali xamir", "500", "g"],
      ["Qiyma (qo‘y go‘shti)", "400", "g"],
      ["Piyoz", "3", "ta katta"],
      ["Zira", "1", "choy qoshiq"],
      ["Tuz", "1", "choy qoshiq"],
      ["Tuxum sarig‘i", "1", "ta"],
    ]),
    steps: steps([
      { title: "Ichini tayyorlang", instruction: "Piyozni mayda to‘g‘rang va qiyma, zira, tuz bilan aralashtiring.", photo: PHOTOS.onions, uses: [2, 3, 4, 5] },
      { title: "Duxovkani qizdiring", instruction: "Duxovkani 200°C gacha qizdiring va patnisga qog‘oz to‘shang.", minutes: 10, celsius: 200 },
      { title: "Somsani tuging", instruction: "Xamirni kvadratlarga kesing, ichini soling va uchburchak qilib buklab, chetlarini yaxshilab yopishtiring.", uses: [1], tip: "Havoni siqib chiqaring, shunda somsa shishib ketmaydi." },
      { title: "Surting va pishiring", instruction: "Ustiga tuxum sarig‘ini surting va tillarang tusga kirguncha pishiring.", photo: PHOTOS.platter, minutes: 30, celsius: 200, uses: [6] },
    ]),
    media: [cover(PHOTOS.platter, "Tilla rang pishgan somsalar")],
    tags: ["O‘zbek", "Xamir taom", "Qo‘y go‘shti"],
    publishedAt: PUBLISHED,
    cookedCount: 0,
    rating: { average: 0, count: 0 },
  },
  {
    id: "5",
    slug: "shivit-oshi-xorazm",
    title: "Shivit oshi — Xorazm ko‘k lag‘moni",
    description: "Xorazmning shivit bilan ko‘k rangga kirgan lag‘moni: go‘shtli sabzavot qaylasi va qatiq bilan tortiladi.",
    coverMedia: cover(PHOTOS.pasta, "Go‘sht va sabzavotli lag‘mon"),
    creator: CREATORS[2],
    servings: 4,
    prepTimeMinutes: 40,
    cookTimeMinutes: 40,
    difficulty: "medium",
    isPremium: false,
    ingredients: ing([
      ["Un", "400", "g"],
      ["Shivit (ukrop)", "1", "bog‘"],
      ["Tuxum", "2", "ta"],
      ["Mol go‘shti", "300", "g"],
      ["Kartoshka", "2", "ta"],
      ["Qatiq", "200", "g"],
      ["Tuz", "1.5", "choy qoshiq"],
    ]),
    steps: steps([
      { title: "Shivitni maydalang", instruction: "Shivitni tuxum va bir oz suv bilan blenderda silliq massa qiling.", uses: [2, 3] },
      { title: "Xamir qoring", instruction: "Massani un va tuz bilan aralashtirib xamir qoring. Dam oldiring.", minutes: 20, uses: [1, 7] },
      { title: "Qaylani pishiring", instruction: "Go‘sht va kartoshkani yumshaguncha past olovda damlang.", photo: PHOTOS.soup, minutes: 30, uses: [4, 5] },
      { title: "Xamirni kesib qaynating", instruction: "Xamirni yupqa yoying, tasmalarga kesing va qaynoq suvda pishiring.", minutes: 4, celsius: 100 },
      { title: "Tortish", instruction: "Lag‘monni likopchaga soling, ustiga qayla va bir qoshiq qatiq qo‘ying.", photo: PHOTOS.pasta, uses: [6] },
    ]),
    media: [cover(PHOTOS.pasta, "Go‘sht va sabzavotli lag‘mon")],
    tags: ["Xorazm", "Lag‘mon", "Mol go‘shti"],
    publishedAt: PUBLISHED,
    cookedCount: 0,
    rating: { average: 0, count: 0 },
  },
  {
    id: "6",
    slug: "achchiq-chuchuk-salat",
    title: "Achchiq-chuchuk — yangi pomidor salati",
    description: "Har qanday yog‘li taomga yarashadigan, yangi pomidor va piyozdan tayyorlanadigan achchiq salat.",
    coverMedia: cover(PHOTOS.veg, "To‘g‘ralgan yangi pomidor va sabzavotlar"),
    creator: CREATORS[2],
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    difficulty: "easy",
    isPremium: false,
    ingredients: ing([
      ["Pomidor", "4", "ta katta"],
      ["Qizil piyoz", "1", "ta"],
      ["Achchiq qalampir", "1", "ta"],
      ["Kinza", "1", "bog‘"],
      ["Tuz", "1", "choy qoshiq"],
    ]),
    steps: steps([
      { title: "Piyozni to‘g‘rang", instruction: "Piyozni juda yupqa to‘g‘rang, tuz sepib 5 daqiqa qo‘ying.", minutes: 5, uses: [2, 5], tip: "Tuz piyozning achchig‘ini yumshatadi." },
      { title: "Pomidorni to‘g‘rang", instruction: "Pomidorni yupqa to‘g‘rab likopchaga qatlam-qatlam terib chiqing.", photo: PHOTOS.veg, uses: [1] },
      { title: "Aralashtirib torting", instruction: "Ustiga piyoz, to‘g‘ralgan qalampir va maydalangan kinza soling. Darrov torting.", uses: [3, 4] },
    ]),
    media: [cover(PHOTOS.veg, "To‘g‘ralgan yangi pomidor va sabzavotlar")],
    tags: ["O‘zbek", "Salat", "Go‘shtsiz"],
    publishedAt: PUBLISHED,
    cookedCount: 0,
    rating: { average: 0, count: 0 },
  },
];
