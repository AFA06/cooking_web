/**
 * Terms of Use and Privacy Policy.
 *
 * THIS IS DEMO TEXT. To publish the final texts:
 *   1. Replace the values in LEGAL below (company, contact, dates).
 *   2. Replace the `sections` of TERMS and PRIVACY (keep the shape; ids become the anchor links).
 *   3. Set LEGAL.isDraft to false — that removes the "draft" notice from both pages.
 * The pages, table of contents, footer links and the sign-up consent line pick everything up from here.
 */

export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  id: string;
  title: string;
  body: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  /** One sentence under the title: what the document is for. */
  summary: string;
  sections: LegalSection[];
}

export const LEGAL = {
  /** true while the text below is a demo; the pages show a notice. */
  isDraft: true,
  /** Shown to readers as "Oxirgi yangilanish". Format: YYYY-MM-DD. */
  updatedAt: "2026-10-12",
  /** PLACEHOLDERS: replace with the real legal entity and contact details. */
  company: "Damda jamoasi",
  contactEmail: "hello@damda.uz",
  contactPhone: "+998 90 000 00 00",
  address: "Toshkent, O‘zbekiston",
} as const;

export const TERMS: LegalDoc = {
  title: "Foydalanish shartlari",
  summary: "Damda’dan foydalanishda o‘zaro huquq va majburiyatlarimiz: hisob, kontent, to‘lovlar va javobgarlik.",
  sections: [
    {
      id: "umumiy",
      title: "1. Umumiy qoidalar",
      body: [
        "Ushbu shartlar Damda veb-saytidan va undagi xizmatlardan (retseptlarni ko‘rish, saqlash, pishirish rejimi, xaridlar ro‘yxati, ijodkorlar kabinetidan) foydalanishni tartibga soladi.",
        "Saytdan foydalanishni davom ettirish yoki hisob yaratish orqali siz ushbu shartlarni o‘qiganingizni va qabul qilganingizni tasdiqlaysiz. Rozi bo‘lmasangiz, xizmatdan foydalanmang.",
      ],
    },
    {
      id: "hisob",
      title: "2. Hisob va xavfsizlik",
      body: [
        "Retseptlarning ko‘p qismini hisobsiz ham ko‘rishingiz mumkin. Retseptlarni saqlash, oshxona daftarlari, xaridlar ro‘yxati va pishirish tarixi uchun hisob kerak.",
        {
          list: [
            "Hisob telefon raqami orqali yaratiladi va SMS orqali yuborilgan kod bilan tasdiqlanadi.",
            "Ro‘yxatdan o‘tishda to‘g‘ri ma’lumot bering va faqat o‘zingizga tegishli raqamdan foydalaning.",
            "Parolingiz va tasdiqlash kodlarini hech kimga bermang. Hisobingizdagi barcha harakatlar uchun o‘zingiz javobgarsiz.",
            "Hisobingiz buzilgan deb o‘ylasangiz, darhol bizga xabar bering.",
          ],
        },
        "Bitta shaxs bir nechta soxta hisob yaratmasligi kerak. Xizmatdan foydalanish uchun kamida 14 yosh talab etiladi; 18 yoshgacha bo‘lganlar ota-onasi yoki qonuniy vakilining ruxsati bilan foydalanadi.",
      ],
    },
    {
      id: "kontent",
      title: "3. Retseptlar va kontent",
      body: [
        "Retseptlarni mustaqil ijodkorlar nashr etadi. Retsept, rasm va matnlarga bo‘lgan huquqlar ularning mualliflariga tegishli.",
        "Sizga retseptlarni shaxsiy, notijorat maqsadda ko‘rish, saqlash va pishirish huquqi beriladi. Kontentni ruxsatsiz nusxalash, qayta sotish yoki boshqa saytda e’lon qilish taqiqlanadi.",
        "Siz qoldirgan izoh va baholar uchun o‘zingiz javobgarsiz. Biz qoidalarni buzgan yoki haqoratli kontentni olib tashlash huquqini saqlab qolamiz.",
      ],
    },
    {
      id: "xavfsizlik",
      title: "4. Oziq-ovqat xavfsizligi va allergenlar",
      body: [
        "Retseptlar pishirish bo‘yicha yo‘l-yo‘riq sifatida beriladi. Ozuqaviy qiymatlar (kaloriya, oqsil, yog‘, uglevod) taxminiy hisoblangan va aniq tibbiy ma’lumot emas.",
        "Allergiyangiz yoki maxsus parhezingiz bo‘lsa, ingredientlarni o‘zingiz tekshiring. Go‘sht, tuxum, sut va baliqni to‘liq pishirishga rioya qiling. Damda retseptlarga rioya qilish natijasida yuzaga kelgan sog‘liq muammolari uchun javobgar emas.",
      ],
    },
    {
      id: "tolovlar",
      title: "5. Premium retseptlar va to‘lovlar",
      body: [
        "Ba’zi retseptlar premium bo‘lib, to‘liq ko‘rish uchun bir martalik to‘lov talab qilinadi. Narx retsept sahifasida to‘lovdan oldin ko‘rsatiladi.",
        {
          list: [
            "To‘lov tizimi ulangunga qadar premium retseptlarni ochish imkoni cheklangan bo‘lishi mumkin.",
            "Raqamli kontent to‘liq ochilgach, to‘lov odatda qaytarilmaydi; texnik xatolik yoki ikki marta to‘lov holatlarida bizga murojaat qiling.",
            "Narxlar va to‘lov usullari o‘zgarishi mumkin; o‘zgarish avval to‘langan xaridlarga ta’sir qilmaydi.",
          ],
        },
      ],
    },
    {
      id: "ijodkorlar",
      title: "6. Ijodkorlar",
      body: [
        "Retsept nashr etgan ijodkor o‘zi yuklagan matn, rasm va videolarga bo‘lgan huquqlarga ega ekanini va ular uchinchi shaxs huquqlarini buzmasligini kafolatlaydi.",
        "Ijodkor Damda’ga kontentni sayt doirasida ko‘rsatish, saqlash va targ‘ib qilish uchun bepul, ko‘chirib bo‘lmaydigan ruxsat beradi. Ijodkor istalgan vaqtda o‘z retseptini nashrdan olishi mumkin.",
        "Daromad taqsimoti va komissiya shartlari ijodkorlar sahifasida alohida yoziladi va ushbu shartlarning ajralmas qismi hisoblanadi.",
      ],
    },
    {
      id: "taqiqlar",
      title: "7. Taqiqlangan harakatlar",
      body: [
        {
          list: [
            "Boshqa foydalanuvchining hisobiga ruxsatsiz kirishga urinish yoki xizmatni buzishga qaratilgan har qanday harakat.",
            "Avtomatik vositalar (bot, skreyper) orqali kontent yig‘ish yoki ro‘yxatdan o‘tish.",
            "Qonunga zid, haqoratli yoki yolg‘on kontent joylashtirish.",
            "Boshqa shaxs nomidan yoki uning telefon raqamidan foydalanib hisob yaratish.",
          ],
        },
      ],
    },
    {
      id: "javobgarlik",
      title: "8. Javobgarlikni cheklash",
      body: [
        "Xizmat “mavjud holicha” taqdim etiladi. Uzluksiz va xatosiz ishlashiga kafolat bermaymiz, ammo uni barqaror saqlash uchun harakat qilamiz.",
        "Qonunda ruxsat etilgan darajada Damda xizmatdan foydalanish yoki foydalana olmaslik tufayli yuzaga kelgan bilvosita zararlar uchun javobgar emas.",
      ],
    },
    {
      id: "toxtatish",
      title: "9. Hisobni to‘xtatish va o‘chirish",
      body: [
        "Shartlarni buzgan hisobni ogohlantirib yoki ogohlantirmasdan cheklash yoki o‘chirish huquqini saqlab qolamiz.",
        "O‘z hisobingizni istalgan vaqtda o‘chirishni so‘rashingiz mumkin; buning uchun biz bilan bog‘laning.",
      ],
    },
    {
      id: "ozgarishlar",
      title: "10. Shartlarning o‘zgarishi",
      body: [
        "Shartlarni yangilashimiz mumkin. Muhim o‘zgarishlar haqida saytda xabar beramiz. Yangilanishdan keyin xizmatdan foydalanishni davom ettirsangiz, yangi shartlarni qabul qilgan hisoblanasiz.",
        "Ushbu shartlarga O‘zbekiston Respublikasi qonunchiligi tatbiq etiladi.",
      ],
    },
    {
      id: "aloqa",
      title: "11. Aloqa",
      body: [`Savollar uchun: ${LEGAL.contactEmail} yoki ${LEGAL.contactPhone}.`],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  title: "Maxfiylik siyosati",
  summary: "Qanday ma’lumotlarni yig‘amiz, nima uchun kerakligi, qancha saqlanishi va siz nimani nazorat qila olishingiz.",
  sections: [
    {
      id: "kim",
      title: "1. Ma’lumotlaringiz egasi kim",
      body: [
        `Shaxsiy ma’lumotlaringizni ${LEGAL.company} (“Damda”, “biz”) qayta ishlaydi. Aloqa: ${LEGAL.contactEmail}.`,
      ],
    },
    {
      id: "yigamiz",
      title: "2. Qanday ma’lumotlarni yig‘amiz",
      body: [
        {
          list: [
            "Hisob ma’lumotlari: ism, telefon raqami, (ixtiyoriy) email va foydalanuvchi nomi.",
            "Parol: faqat qaytarib bo‘lmaydigan shifrlangan ko‘rinishda saqlanadi; asl parolni biz ham bilmaymiz.",
            "Faoliyat: saqlangan retseptlar, oshxona daftarlari, xaridlar ro‘yxati, pishirish tarixi, baho va izohlar.",
            "Siz yuklagan kontent: pishirgan taomingiz rasmlari, ijodkor profili ma’lumotlari.",
            "Texnik ma’lumotlar: sessiya cookie’si, xavfsizlik uchun urinishlar soni (manzilingiz shifrlangan ko‘rinishda).",
          ],
        },
      ],
    },
    {
      id: "maqsad",
      title: "3. Ulardan nima uchun foydalanamiz",
      body: [
        {
          list: [
            "Hisobingizni yaratish, tizimga kirishingizni va xavfsizligini ta’minlash.",
            "Saqlangan retseptlar, daftarlar va tarixni ko‘rsatish.",
            "Xizmatni yaxshilash va suiiste’molning oldini olish.",
            "To‘lov tizimi ulangach — xaridlaringizni qayta ishlash.",
          ],
        },
        "Shaxsiy ma’lumotlaringizni sotmaymiz va reklama maqsadida uchinchi shaxslarga bermaymiz.",
      ],
    },
    {
      id: "kodlar",
      title: "4. SMS va email kodlari",
      body: [
        "Telefon raqamingizga tasdiqlash va parolni tiklash kodlarini SMS orqali, emailingizga esa (agar kiritgan bo‘lsangiz) xat orqali yuboramiz.",
        "Kodlar qisqa muddat amal qiladi va faqat bir marta ishlatiladi. Telefon raqami va email faqat shu maqsadlarda hamda hisobingiz xavfsizligi uchun ishlatiladi.",
      ],
    },
    {
      id: "ulashish",
      title: "5. Ma’lumotlar kimga uzatiladi",
      body: [
        "Xizmatni ishlatish uchun ishonchli xizmat ko‘rsatuvchilardan foydalanamiz; ular ma’lumotlarni faqat bizning topshirig‘imiz bilan qayta ishlaydi:",
        {
          list: [
            "SMS va email yetkazib beruvchi — kodlarni yuborish uchun.",
            "Hosting va ma’lumotlar bazasi provayderi — saytni va ma’lumotlarni saqlash uchun.",
            "To‘lov provayderi — to‘lov ulangach, xaridni amalga oshirish uchun.",
          ],
        },
        "Qonun talab qilgan hollarda vakolatli davlat organlariga ma’lumot berilishi mumkin.",
      ],
    },
    {
      id: "cookie",
      title: "6. Cookie fayllar",
      body: [
        "Tizimda qolishingiz uchun sessiya cookie’sidan, ro‘yxatdan o‘tish jarayonini xavfsiz yakunlash uchun esa qisqa muddatli xavfsizlik cookie’sidan foydalanamiz. Reklama yoki kuzatuv cookie’lari ishlatilmaydi.",
      ],
    },
    {
      id: "muddat",
      title: "7. Qancha vaqt saqlanadi",
      body: [
        "Hisob ma’lumotlari hisobingiz mavjud bo‘lguncha saqlanadi. Hisobni o‘chirish so‘ralganda, qonun boshqacha talab qilmasa, ma’lumotlar o‘chiriladi. Bir martalik kodlar va xavfsizlik yozuvlari qisqa muddatdan keyin avtomatik tozalanadi.",
      ],
    },
    {
      id: "himoya",
      title: "8. Ma’lumotlar himoyasi",
      body: [
        "Parollar shifrlanadi, aloqa HTTPS orqali himoyalanadi, kodlar esa ochiq ko‘rinishda saqlanmaydi. Tizimga kirish urinishlari cheklanadi. Shunga qaramay, hech bir tizim 100% xavfsiz emas; parolingizni sir saqlang.",
      ],
    },
    {
      id: "huquqlar",
      title: "9. Sizning huquqlaringiz",
      body: [
        "O‘zbekiston Respublikasining shaxsga doir ma’lumotlar to‘g‘risidagi qonunchiligiga muvofiq siz quyidagilarga haqlisiz:",
        {
          list: [
            "o‘zingiz haqingizdagi ma’lumotlarni bilish va nusxasini olish;",
            "noto‘g‘ri ma’lumotlarni tuzatish (profil sozlamalarida o‘zingiz qila olasiz);",
            "ma’lumotlaringizni o‘chirishni yoki qayta ishlashni to‘xtatishni so‘rash;",
            "rozilikni qaytarib olish.",
          ],
        },
        `So‘rovlaringizni ${LEGAL.contactEmail} manziliga yuboring.`,
      ],
    },
    {
      id: "bolalar",
      title: "10. Bolalar",
      body: ["Xizmat 14 yoshdan kichik bolalar uchun mo‘ljallanmagan. Bunday ma’lumot aniqlansa, uni o‘chiramiz."],
    },
    {
      id: "ozgarishlar",
      title: "11. O‘zgarishlar",
      body: ["Siyosatni yangilashimiz mumkin. Oxirgi yangilanish sanasi sahifa tepasida ko‘rsatiladi; muhim o‘zgarishlar haqida saytda xabar beramiz."],
    },
  ],
};
