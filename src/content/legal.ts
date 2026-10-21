/**
 * Terms of Use and Privacy Policy, in every site language.
 *
 * The texts describe how the site really works (Telegram payments straight to the author, no commission,
 * email-only codes). Change them together with the feature, in every language, and bump LEGAL.updatedAt.
 * Keep the shape of `sections`: ids become anchor links.
 * The pages, table of contents, footer links and the sign-up consent line pick everything up from here.
 */
import type { Locale } from "@/i18n/core";
import { BRAND_NAME } from "@/lib/brand";

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
  isDraft: false,
  /** Shown to readers as the last-updated date. Format: YYYY-MM-DD. */
  updatedAt: "2026-10-21",
  company: BRAND_NAME,
  contactEmail: "retseplar@gmail.com",
} as const;

const { contactEmail: MAIL, company: CO } = LEGAL;

/* ───────────────────────────── Terms of use ───────────────────────────── */

const TERMS_UZ: LegalDoc = {
  title: "Foydalanish shartlari",
  summary: "Retseplar’dan foydalanishda o‘zaro huquq va majburiyatlarimiz: hisob, kontent, to‘lovlar va javobgarlik.",
  sections: [
    { id: "umumiy", title: "1. Umumiy qoidalar", body: [
      "Ushbu shartlar Retseplar veb-saytidan va undagi xizmatlardan (retseptlarni ko‘rish, saqlash, pishirish rejimi, xaridlar ro‘yxati, ijodkorlar kabinetidan) foydalanishni tartibga soladi.",
      "Saytdan foydalanishni davom ettirish yoki hisob yaratish orqali siz ushbu shartlarni o‘qiganingizni va qabul qilganingizni tasdiqlaysiz. Rozi bo‘lmasangiz, xizmatdan foydalanmang.",
    ] },
    { id: "hisob", title: "2. Hisob va xavfsizlik", body: [
      "Retseptlarning ko‘p qismini hisobsiz ham ko‘rishingiz mumkin. Retseptlarni saqlash, oshxona daftarlari, xaridlar ro‘yxati va pishirish tarixi uchun hisob kerak.",
      { list: [
        "Hisob telefon raqami va parol bilan yaratiladi. Email ixtiyoriy, lekin parolni tiklash kodi faqat emailga yuboriladi.",
        "Ro‘yxatdan o‘tishda to‘g‘ri ma’lumot bering va faqat o‘zingizga tegishli raqamdan foydalaning.",
        "Parolingiz va tasdiqlash kodlarini hech kimga bermang. Hisobingizdagi barcha harakatlar uchun o‘zingiz javobgarsiz.",
        "Hisobingiz buzilgan deb o‘ylasangiz, darhol bizga xabar bering.",
      ] },
      "Bitta shaxs bir nechta soxta hisob yaratmasligi kerak. Xizmatdan foydalanish uchun kamida 14 yosh talab etiladi; 18 yoshgacha bo‘lganlar ota-onasi yoki qonuniy vakilining ruxsati bilan foydalanadi.",
    ] },
    { id: "kontent", title: "3. Retseptlar va kontent", body: [
      "Retseptlarni mustaqil ijodkorlar nashr etadi. Retsept, rasm va matnlarga bo‘lgan huquqlar ularning mualliflariga tegishli.",
      "Sizga retseptlarni shaxsiy, notijorat maqsadda ko‘rish, saqlash va pishirish huquqi beriladi. Kontentni ruxsatsiz nusxalash, qayta sotish yoki boshqa saytda e’lon qilish taqiqlanadi.",
      "Siz qoldirgan izoh va baholar uchun o‘zingiz javobgarsiz. Biz qoidalarni buzgan yoki haqoratli kontentni olib tashlash huquqini saqlab qolamiz.",
    ] },
    { id: "xavfsizlik", title: "4. Oziq-ovqat xavfsizligi va allergenlar", body: [
      "Retseptlar pishirish bo‘yicha yo‘l-yo‘riq sifatida beriladi. Ozuqaviy qiymatlar (kaloriya, oqsil, yog‘, uglevod) taxminiy hisoblangan va aniq tibbiy ma’lumot emas.",
      "Allergiyangiz yoki maxsus parhezingiz bo‘lsa, ingredientlarni o‘zingiz tekshiring. Go‘sht, tuxum, sut va baliqni to‘liq pishirishga rioya qiling. Retseplar retseptlarga rioya qilish natijasida yuzaga kelgan sog‘liq muammolari uchun javobgar emas.",
    ] },
    { id: "tolovlar", title: "5. Premium retseptlar va to‘lovlar", body: [
      "Ba’zi retseptlar premium bo‘lib, to‘liq ko‘rish uchun bir martalik to‘lov talab qilinadi. Narxni retsept muallifi belgilaydi va u retsept sahifasida to‘lovdan oldin ko‘rsatiladi.",
      { list: [
        "To‘lov to‘g‘ridan-to‘g‘ri retsept muallifiga qilinadi: «Sotib olish» tugmasi muallifning Telegram chatini tayyor xabar va buyurtma kodi bilan ochadi, to‘lov tafsilotlarini muallif yuboradi.",
        "Retseplar to‘lovlarni qabul qilmaydi va karta ma’lumotlaringizni so‘ramaydi yoki saqlamaydi.",
        "Muallif to‘lovni tasdiqlagach, retsept hisobingizda ochiladi.",
        "To‘lov va pulni qaytarish masalalari xaridor va muallif o‘rtasida hal qilinadi. Muammo bo‘lsa, buyurtma kodi bilan bizga yozing — hal qilishga yordam beramiz.",
        "Narxlar o‘zgarishi mumkin; o‘zgarish avval ochilgan retseptlarga ta’sir qilmaydi.",
      ] },
    ] },
    { id: "ijodkorlar", title: "6. Ijodkorlar", body: [
      "Ijodkorlar hisobini Retseplar jamoasi yaratadi va kirish ma’lumotlarini ijodkorga shaxsan beradi.",
      "Retsept nashr etgan ijodkor o‘zi yuklagan matn, rasm va videolarga bo‘lgan huquqlarga ega ekanini va ular uchinchi shaxs huquqlarini buzmasligini kafolatlaydi.",
      "Ijodkor Retseplar’ga kontentni sayt doirasida ko‘rsatish, saqlash va targ‘ib qilish uchun bepul, ko‘chirib bo‘lmaydigan ruxsat beradi. Ijodkor istalgan vaqtda o‘z retseptini nashrdan olishi mumkin.",
      "Hozircha Retseplar komissiya olmaydi: premium retseptlardan tushgan to‘lov to‘liq ijodkorga qoladi. Bu shart o‘zgarsa, ijodkorlarga oldindan xabar beriladi.",
    ] },
    { id: "taqiqlar", title: "7. Taqiqlangan harakatlar", body: [
      { list: [
        "Boshqa foydalanuvchining hisobiga ruxsatsiz kirishga urinish yoki xizmatni buzishga qaratilgan har qanday harakat.",
        "Avtomatik vositalar (bot, skreyper) orqali kontent yig‘ish yoki ro‘yxatdan o‘tish.",
        "Qonunga zid, haqoratli yoki yolg‘on kontent joylashtirish.",
        "Boshqa shaxs nomidan yoki uning telefon raqamidan foydalanib hisob yaratish.",
      ] },
    ] },
    { id: "javobgarlik", title: "8. Javobgarlikni cheklash", body: [
      "Xizmat “mavjud holicha” taqdim etiladi. Uzluksiz va xatosiz ishlashiga kafolat bermaymiz, ammo uni barqaror saqlash uchun harakat qilamiz.",
      "Qonunda ruxsat etilgan darajada Retseplar xizmatdan foydalanish yoki foydalana olmaslik tufayli yuzaga kelgan bilvosita zararlar uchun javobgar emas.",
    ] },
    { id: "toxtatish", title: "9. Hisobni to‘xtatish va o‘chirish", body: [
      "Shartlarni buzgan hisobni ogohlantirib yoki ogohlantirmasdan cheklash yoki o‘chirish huquqini saqlab qolamiz.",
      "O‘z hisobingizni istalgan vaqtda o‘chirishni so‘rashingiz mumkin; buning uchun biz bilan bog‘laning.",
    ] },
    { id: "ozgarishlar", title: "10. Shartlarning o‘zgarishi", body: [
      "Shartlarni yangilashimiz mumkin. Muhim o‘zgarishlar haqida saytda xabar beramiz. Yangilanishdan keyin xizmatdan foydalanishni davom ettirsangiz, yangi shartlarni qabul qilgan hisoblanasiz.",
      "Ushbu shartlarga O‘zbekiston Respublikasi qonunchiligi tatbiq etiladi.",
    ] },
    { id: "aloqa", title: "11. Aloqa", body: [`Savollar uchun: ${MAIL}.`] },
  ],
};

const TERMS_RU: LegalDoc = {
  title: "Условия использования",
  summary: "Наши взаимные права и обязанности при использовании Retseplar: аккаунт, контент, платежи и ответственность.",
  sections: [
    { id: "umumiy", title: "1. Общие положения", body: [
      "Настоящие условия регулируют использование сайта Retseplar и его сервисов (просмотр и сохранение рецептов, пошаговый режим, список покупок, кабинет автора).",
      "Продолжая пользоваться сайтом или создавая аккаунт, вы подтверждаете, что прочитали и приняли эти условия. Если вы не согласны, не пользуйтесь сервисом.",
    ] },
    { id: "hisob", title: "2. Аккаунт и безопасность", body: [
      "Большинство рецептов можно смотреть без аккаунта. Аккаунт нужен для сохранения рецептов, книг рецептов, списка покупок и истории готовки.",
      { list: [
        "Аккаунт создаётся по номеру телефона и паролю. Email необязателен, но код для восстановления пароля приходит только на email.",
        "Указывайте достоверные данные и используйте только принадлежащий вам номер.",
        "Никому не сообщайте пароль и коды подтверждения. Вы отвечаете за все действия в своём аккаунте.",
        "Если вы считаете, что аккаунт взломан, немедленно сообщите нам.",
      ] },
      "Один человек не должен создавать несколько фиктивных аккаунтов. Для использования сервиса необходимо быть не младше 14 лет; лица младше 18 лет пользуются сервисом с разрешения родителей или законных представителей.",
    ] },
    { id: "kontent", title: "3. Рецепты и контент", body: [
      "Рецепты публикуют независимые авторы. Права на рецепты, фотографии и тексты принадлежат их авторам.",
      "Вам предоставляется право просматривать, сохранять и готовить рецепты в личных некоммерческих целях. Копировать, перепродавать контент или публиковать его на других сайтах без разрешения запрещено.",
      "Вы несёте ответственность за оставленные вами комментарии и оценки. Мы оставляем за собой право удалять контент, нарушающий правила или оскорбительный.",
    ] },
    { id: "xavfsizlik", title: "4. Безопасность питания и аллергены", body: [
      "Рецепты предоставляются как кулинарные рекомендации. Пищевая ценность (калории, белки, жиры, углеводы) рассчитана приблизительно и не является точной медицинской информацией.",
      "Если у вас аллергия или особая диета, проверяйте ингредиенты самостоятельно. Тщательно прожаривайте мясо, яйца и рыбу. Retseplar не отвечает за проблемы со здоровьем, возникшие при приготовлении по рецептам.",
    ] },
    { id: "tolovlar", title: "5. Премиум-рецепты и платежи", body: [
      "Некоторые рецепты — премиум: чтобы открыть их полностью, нужна разовая оплата. Цену устанавливает автор рецепта, она показана на странице рецепта до оплаты.",
      { list: [
        "Оплата идёт напрямую автору рецепта: кнопка «Купить» открывает Telegram-чат автора с готовым сообщением и кодом заказа, реквизиты для оплаты присылает автор.",
        "Retseplar не принимает платежи и не запрашивает и не хранит данные вашей карты.",
        "После того как автор подтвердит оплату, рецепт откроется в вашем аккаунте.",
        "Вопросы оплаты и возврата решаются между покупателем и автором. Если возникла проблема, напишите нам с кодом заказа — мы поможем разобраться.",
        "Цены могут меняться; изменение не затрагивает уже открытые рецепты.",
      ] },
    ] },
    { id: "ijodkorlar", title: "6. Авторы", body: [
      "Аккаунты авторов создаёт команда Retseplar и лично передаёт автору данные для входа.",
      "Автор, публикующий рецепт, гарантирует, что обладает правами на загруженные тексты, фото и видео и что они не нарушают права третьих лиц.",
      "Автор предоставляет Retseplar безвозмездное неисключительное право показывать, хранить и продвигать контент в рамках сайта. Автор может в любой момент снять рецепт с публикации.",
      "Сейчас Retseplar не берёт комиссию: оплата за премиум-рецепты полностью остаётся у автора. Если это условие изменится, авторы узнают об этом заранее.",
    ] },
    { id: "taqiqlar", title: "7. Запрещённые действия", body: [
      { list: [
        "Попытки несанкционированного доступа к чужому аккаунту или любые действия, направленные на нарушение работы сервиса.",
        "Сбор контента или регистрация с помощью автоматических средств (боты, скрейперы).",
        "Публикация незаконного, оскорбительного или заведомо ложного контента.",
        "Создание аккаунта от имени другого человека или с использованием его номера телефона.",
      ] },
    ] },
    { id: "javobgarlik", title: "8. Ограничение ответственности", body: [
      "Сервис предоставляется «как есть». Мы не гарантируем его бесперебойную и безошибочную работу, но стараемся поддерживать его стабильность.",
      "В пределах, разрешённых законом, Retseplar не отвечает за косвенные убытки, возникшие из-за использования или невозможности использования сервиса.",
    ] },
    { id: "toxtatish", title: "9. Блокировка и удаление аккаунта", body: [
      "Мы оставляем за собой право ограничить или удалить аккаунт, нарушающий условия, с предупреждением или без него.",
      "Вы можете в любой момент запросить удаление своего аккаунта, связавшись с нами.",
    ] },
    { id: "ozgarishlar", title: "10. Изменение условий", body: [
      "Мы можем обновлять условия. О существенных изменениях мы сообщим на сайте. Продолжая пользоваться сервисом после обновления, вы принимаете новые условия.",
      "К настоящим условиям применяется законодательство Республики Узбекистан.",
    ] },
    { id: "aloqa", title: "11. Контакты", body: [`По вопросам: ${MAIL}.`] },
  ],
};

const TERMS_EN: LegalDoc = {
  title: "Terms of use",
  summary: "Our mutual rights and obligations when using Retseplar: accounts, content, payments and liability.",
  sections: [
    { id: "umumiy", title: "1. General", body: [
      "These terms govern your use of the Retseplar website and its services (browsing and saving recipes, step-by-step cooking mode, the shopping list and the creator dashboard).",
      "By continuing to use the site or creating an account you confirm that you have read and accepted these terms. If you do not agree, please do not use the service.",
    ] },
    { id: "hisob", title: "2. Your account and security", body: [
      "You can view most recipes without an account. An account is needed to save recipes, keep recipe books, use the shopping list and keep a cooking history.",
      { list: [
        "Accounts are created with a phone number and a password. Email is optional, but password-reset codes are sent only by email.",
        "Give accurate information when signing up and use only a number that belongs to you.",
        "Never share your password or confirmation codes. You are responsible for everything that happens in your account.",
        "If you think your account has been compromised, tell us straight away.",
      ] },
      "One person must not create several fake accounts. You must be at least 14 years old to use the service; people under 18 use it with the permission of a parent or legal guardian.",
    ] },
    { id: "kontent", title: "3. Recipes and content", body: [
      "Recipes are published by independent creators. Rights to recipes, photos and texts belong to their authors.",
      "You are granted the right to view, save and cook recipes for personal, non-commercial use. Copying, reselling or republishing content elsewhere without permission is prohibited.",
      "You are responsible for the comments and ratings you leave. We reserve the right to remove content that breaks the rules or is offensive.",
    ] },
    { id: "xavfsizlik", title: "4. Food safety and allergens", body: [
      "Recipes are provided as cooking guidance. Nutrition values (calories, protein, fat, carbohydrates) are estimates and are not precise medical information.",
      "If you have an allergy or a special diet, check the ingredients yourself. Cook meat, eggs and fish thoroughly. Retseplar is not responsible for health problems resulting from following recipes.",
    ] },
    { id: "tolovlar", title: "5. Premium recipes and payments", body: [
      "Some recipes are premium and need a one-time payment to open in full. The recipe's author sets the price, which is shown on the recipe page before you pay.",
      { list: [
        "You pay the recipe's author directly: the “Buy” button opens the author's Telegram chat with a ready message and an order code, and the author sends the payment details.",
        "Retseplar does not take payments and never asks for or stores your card details.",
        "Once the author confirms the payment, the recipe opens in your account.",
        "Payment and refund questions are settled between the buyer and the author. If something goes wrong, write to us with the order code and we will help sort it out.",
        "Prices may change; a change does not affect recipes you have already opened.",
      ] },
    ] },
    { id: "ijodkorlar", title: "6. Creators", body: [
      "Creator accounts are made by the Retseplar team, which hands the sign-in details to the creator personally.",
      "A creator who publishes a recipe guarantees that they hold the rights to the text, photos and videos they upload and that these do not infringe anyone else's rights.",
      "The creator grants Retseplar a free, non-exclusive licence to display, store and promote the content within the site. A creator can unpublish their recipe at any time.",
      "For now Retseplar takes no commission: payments for premium recipes go entirely to the creator. If this changes, creators will be told in advance.",
    ] },
    { id: "taqiqlar", title: "7. Prohibited conduct", body: [
      { list: [
        "Attempting to gain unauthorised access to another person's account, or any action aimed at disrupting the service.",
        "Collecting content or registering with automated tools (bots, scrapers).",
        "Posting unlawful, offensive or knowingly false content.",
        "Creating an account in another person's name or with their phone number.",
      ] },
    ] },
    { id: "javobgarlik", title: "8. Limitation of liability", body: [
      "The service is provided “as is”. We do not guarantee uninterrupted or error-free operation, but we work to keep it stable.",
      "To the extent permitted by law, Retseplar is not liable for indirect damages arising from using, or being unable to use, the service.",
    ] },
    { id: "toxtatish", title: "9. Suspending and deleting accounts", body: [
      "We reserve the right to restrict or delete an account that breaks these terms, with or without warning.",
      "You can ask for your account to be deleted at any time by contacting us.",
    ] },
    { id: "ozgarishlar", title: "10. Changes to these terms", body: [
      "We may update these terms. We will announce significant changes on the site. If you keep using the service after an update, you accept the new terms.",
      "These terms are governed by the laws of the Republic of Uzbekistan.",
    ] },
    { id: "aloqa", title: "11. Contact", body: [`Questions: ${MAIL}.`] },
  ],
};

const TERMS_KZ: LegalDoc = {
  title: "Пайдалану шарттары",
  summary: "Retseplar қызметін пайдалану кезіндегі өзара құқықтарымыз бен міндеттеріміз: аккаунт, контент, төлемдер және жауапкершілік.",
  sections: [
    { id: "umumiy", title: "1. Жалпы ережелер", body: [
      "Осы шарттар Retseplar веб-сайтын және ондағы қызметтерді (рецепттерді қарау мен сақтау, қадамдық режим, сатып алу тізімі, авторлар кабинеті) пайдалануды реттейді.",
      "Сайтты пайдалануды жалғастыру немесе аккаунт жасау арқылы сіз осы шарттарды оқып, қабылдағаныңызды растайсыз. Келіспесеңіз, қызметті пайдаланбаңыз.",
    ] },
    { id: "hisob", title: "2. Аккаунт және қауіпсіздік", body: [
      "Рецепттердің көбін аккаунтсыз да қарауға болады. Рецептерді сақтау, рецепт кітаптары, сатып алу тізімі және дайындау тарихы үшін аккаунт қажет.",
      { list: [
        "Аккаунт телефон нөмірі мен құпиясөз арқылы жасалады. Email міндетті емес, бірақ құпиясөзді қалпына келтіру коды тек email-ға жіберіледі.",
        "Тіркелу кезінде дұрыс мәлімет беріңіз және тек өзіңізге тиесілі нөмірді пайдаланыңыз.",
        "Құпиясөзіңізді және растау кодтарын ешкімге бермеңіз. Аккаунтыңыздағы барлық әрекеттерге өзіңіз жауаптысыз.",
        "Аккаунтыңыз бұзылған деп ойласаңыз, бізге дереу хабарлаңыз.",
      ] },
      "Бір адам бірнеше жалған аккаунт жасамауы керек. Қызметті пайдалану үшін кемінде 14 жас талап етіледі; 18 жасқа дейінгілер ата-анасының немесе заңды өкілінің рұқсатымен пайдаланады.",
    ] },
    { id: "kontent", title: "3. Рецепттер және контент", body: [
      "Рецепттерді тәуелсіз авторлар жариялайды. Рецепттерге, суреттер мен мәтіндерге құқықтар олардың авторларына тиесілі.",
      "Сізге рецепттерді жеке, коммерциялық емес мақсатта қарауға, сақтауға және дайындауға құқық беріледі. Контентті рұқсатсыз көшіруге, қайта сатуға немесе басқа сайтта жариялауға тыйым салынады.",
      "Сіз қалдырған пікірлер мен бағалар үшін өзіңіз жауаптысыз. Біз ережелерді бұзатын немесе қорлайтын контентті жою құқығын өзімізде қалдырамыз.",
    ] },
    { id: "xavfsizlik", title: "4. Тағам қауіпсіздігі және аллергендер", body: [
      "Рецепттер дайындау бойынша нұсқаулық ретінде беріледі. Қоректік құндылықтар (калория, ақуыз, май, көмірсу) шамамен есептелген және нақты медициналық ақпарат емес.",
      "Аллергияңыз немесе арнайы диетаңыз болса, ингредиенттерді өзіңіз тексеріңіз. Ет, жұмыртқа мен балықты толық пісіріңіз. Рецепттерді орындау нәтижесінде туындаған денсаулық мәселелері үшін Retseplar жауап бермейді.",
    ] },
    { id: "tolovlar", title: "5. Премиум рецепттер және төлемдер", body: [
      "Кейбір рецепттер премиум: толық ашу үшін бір реттік төлем қажет. Бағаны рецепт авторы белгілейді, ол төлемге дейін рецепт бетінде көрсетіледі.",
      { list: [
        "Төлем рецепт авторына тікелей жасалады: «Сатып алу» түймесі автордың Telegram чатын дайын хабарлама және тапсырыс кодымен ашады, төлем деректемелерін автор жібереді.",
        "Retseplar төлем қабылдамайды және карта деректеріңізді сұрамайды, сақтамайды.",
        "Автор төлемді растағаннан кейін рецепт аккаунтыңызда ашылады.",
        "Төлем мен қайтару мәселелері сатып алушы мен автор арасында шешіледі. Мәселе туындаса, тапсырыс кодымен бізге жазыңыз — шешуге көмектесеміз.",
        "Бағалар өзгеруі мүмкін; өзгеріс бұрын ашылған рецепттерге әсер етпейді.",
      ] },
    ] },
    { id: "ijodkorlar", title: "6. Авторлар", body: [
      "Авторлар аккаунтын Retseplar командасы жасайды және кіру деректерін авторға жеке береді.",
      "Рецепт жариялаған автор жүктеген мәтін, сурет және бейнелерге құқығы бар екеніне және олар үшінші тұлғалардың құқықтарын бұзбайтынына кепілдік береді.",
      "Автор Retseplar-ға контентті сайт аясында көрсетуге, сақтауға және насихаттауға тегін, айрықша емес рұқсат береді. Автор кез келген уақытта өз рецептін жариялаудан алып тастай алады.",
      "Әзірге Retseplar комиссия алмайды: премиум рецепттер үшін төлем толығымен авторда қалады. Бұл шарт өзгерсе, авторларға алдын ала хабарланады.",
    ] },
    { id: "taqiqlar", title: "7. Тыйым салынған әрекеттер", body: [
      { list: [
        "Басқа пайдаланушының аккаунтына рұқсатсыз кіруге әрекет жасау немесе қызметті бұзуға бағытталған кез келген әрекет.",
        "Автоматты құралдар (бот, скрейпер) арқылы контент жинау немесе тіркелу.",
        "Заңға қайшы, қорлайтын немесе жалған контент жариялау.",
        "Басқа адамның атынан немесе оның телефон нөмірін пайдаланып аккаунт жасау.",
      ] },
    ] },
    { id: "javobgarlik", title: "8. Жауапкершілікті шектеу", body: [
      "Қызмет «бар күйінде» ұсынылады. Оның үздіксіз және қатесіз жұмыс істеуіне кепілдік бермейміз, бірақ тұрақты болуы үшін әрекет етеміз.",
      "Заңмен рұқсат етілген деңгейде Retseplar қызметті пайдаланудан немесе пайдалана алмаудан туындаған жанама залал үшін жауап бермейді.",
    ] },
    { id: "toxtatish", title: "9. Аккаунтты тоқтату және жою", body: [
      "Шарттарды бұзған аккаунтты ескертіп немесе ескертпей шектеу немесе жою құқығын өзімізде қалдырамыз.",
      "Өз аккаунтыңызды кез келген уақытта жоюды сұрай аласыз; ол үшін бізбен байланысыңыз.",
    ] },
    { id: "ozgarishlar", title: "10. Шарттардың өзгеруі", body: [
      "Шарттарды жаңартуымыз мүмкін. Маңызды өзгерістер туралы сайтта хабарлаймыз. Жаңартудан кейін қызметті пайдалануды жалғастырсаңыз, жаңа шарттарды қабылдаған боласыз.",
      "Осы шарттарға Өзбекстан Республикасының заңнамасы қолданылады.",
    ] },
    { id: "aloqa", title: "11. Байланыс", body: [`Сұрақтар үшін: ${MAIL}.`] },
  ],
};

/* ───────────────────────────── Privacy policy ───────────────────────────── */

const PRIVACY_UZ: LegalDoc = {
  title: "Maxfiylik siyosati",
  summary: "Qanday ma’lumotlarni yig‘amiz, nima uchun kerakligi, qancha saqlanishi va siz nimani nazorat qila olishingiz.",
  sections: [
    { id: "kim", title: "1. Ma’lumotlaringiz egasi kim", body: [`Shaxsiy ma’lumotlaringizni ${CO} (“Retseplar”, “biz”) qayta ishlaydi. Aloqa: ${MAIL}.`] },
    { id: "yigamiz", title: "2. Qanday ma’lumotlarni yig‘amiz", body: [{ list: [
      "Hisob ma’lumotlari: ism, telefon raqami, (ixtiyoriy) email va foydalanuvchi nomi.",
      "Parol: faqat qaytarib bo‘lmaydigan shifrlangan ko‘rinishda saqlanadi; asl parolni biz ham bilmaymiz.",
      "Faoliyat: saqlangan retseptlar, oshxona daftarlari, xaridlar ro‘yxati, pishirish tarixi, baho va izohlar, saytdagi ko‘rishlar statistikasi.",
      "Buyurtmalar: premium retsept buyurtmasi kodi, narxi, holati va (rozilik bersangiz) muallifga yuboriladigan ismingiz va telefon raqamingiz.",
      "Siz yuklagan kontent: pishirgan taomingiz rasmlari, ijodkor profili ma’lumotlari, retsept rasmlari va videolari.",
      "Texnik ma’lumotlar: sessiya cookie’si, xavfsizlik uchun urinishlar soni (manzilingiz shifrlangan ko‘rinishda).",
    ] }] },
    { id: "maqsad", title: "3. Ulardan nima uchun foydalanamiz", body: [
      { list: [
        "Hisobingizni yaratish, tizimga kirishingizni va xavfsizligini ta’minlash.",
        "Saqlangan retseptlar, daftarlar va tarixni ko‘rsatish.",
        "Premium retsept buyurtmalarini muallifga yetkazish va to‘lov tasdiqlangach retseptni ochish.",
        "Xizmatni yaxshilash va suiiste’molning oldini olish.",
      ] },
      "Shaxsiy ma’lumotlaringizni sotmaymiz va reklama maqsadida uchinchi shaxslarga bermaymiz.",
    ] },
    { id: "kodlar", title: "4. Email kodlari", body: [
      "Parolni tiklash va emailni tasdiqlash kodlarini emailingizga (agar kiritgan bo‘lsangiz) xat orqali yuboramiz.",
      "Kodlar qisqa muddat amal qiladi va faqat bir marta ishlatiladi. Telefon raqami va email faqat shu maqsadlarda hamda hisobingiz xavfsizligi uchun ishlatiladi.",
    ] },
    { id: "ulashish", title: "5. Ma’lumotlar kimga uzatiladi", body: [
      { list: [
        "Retsept muallifi — siz uning premium retseptini sotib olganingizda: buyurtma kodi, narx va (rozilik bersangiz) ismingiz va telefon raqamingiz. Xabarni Telegram orqali o‘zingiz yuborasiz, shuning uchun unga Telegram qoidalari ham tatbiq etiladi.",
        "Email yetkazib beruvchi — kodlarni yuborish uchun.",
        "Hosting, ma’lumotlar bazasi va fayl saqlash provayderlari — sayt, ma’lumotlar, rasm va videolarni saqlash uchun.",
      ] },
      "Bu xizmat ko‘rsatuvchilar ma’lumotlarni faqat bizning topshirig‘imiz bilan qayta ishlaydi. Qonun talab qilgan hollarda vakolatli davlat organlariga ma’lumot berilishi mumkin.",
    ] },
    { id: "cookie", title: "6. Cookie fayllar", body: ["Tizimda qolishingiz uchun sessiya cookie’sidan foydalanamiz. Til tanlovingiz ham cookie’da eslab qolinadi. Reklama yoki kuzatuv cookie’lari ishlatilmaydi."] },
    { id: "muddat", title: "7. Qancha vaqt saqlanadi", body: ["Hisob ma’lumotlari hisobingiz mavjud bo‘lguncha saqlanadi. Hisobni o‘chirish so‘ralganda, qonun boshqacha talab qilmasa, ma’lumotlar o‘chiriladi. Bir martalik kodlar va xavfsizlik yozuvlari qisqa muddatdan keyin avtomatik tozalanadi."] },
    { id: "himoya", title: "8. Ma’lumotlar himoyasi", body: ["Parollar shifrlanadi, aloqa HTTPS orqali himoyalanadi, kodlar esa ochiq ko‘rinishda saqlanmaydi. Tizimga kirish urinishlari cheklanadi. Shunga qaramay, hech bir tizim 100% xavfsiz emas; parolingizni sir saqlang."] },
    { id: "huquqlar", title: "9. Sizning huquqlaringiz", body: [
      "O‘zbekiston Respublikasining shaxsga doir ma’lumotlar to‘g‘risidagi qonunchiligiga muvofiq siz quyidagilarga haqlisiz:",
      { list: [
        "o‘zingiz haqingizdagi ma’lumotlarni bilish va nusxasini olish;",
        "noto‘g‘ri ma’lumotlarni tuzatish (profil sozlamalarida o‘zingiz qila olasiz);",
        "ma’lumotlaringizni o‘chirishni yoki qayta ishlashni to‘xtatishni so‘rash;",
        "rozilikni qaytarib olish.",
      ] },
      `So‘rovlaringizni ${MAIL} manziliga yuboring.`,
    ] },
    { id: "bolalar", title: "10. Bolalar", body: ["Xizmat 14 yoshdan kichik bolalar uchun mo‘ljallanmagan. Bunday ma’lumot aniqlansa, uni o‘chiramiz."] },
    { id: "ozgarishlar", title: "11. O‘zgarishlar", body: ["Siyosatni yangilashimiz mumkin. Oxirgi yangilanish sanasi sahifa tepasida ko‘rsatiladi; muhim o‘zgarishlar haqida saytda xabar beramiz."] },
  ],
};

const PRIVACY_RU: LegalDoc = {
  title: "Политика конфиденциальности",
  summary: "Какие данные мы собираем, зачем они нужны, как долго хранятся и чем вы можете управлять.",
  sections: [
    { id: "kim", title: "1. Кто обрабатывает ваши данные", body: [`Ваши персональные данные обрабатывает ${CO} («Retseplar», «мы»). Контакты: ${MAIL}.`] },
    { id: "yigamiz", title: "2. Какие данные мы собираем", body: [{ list: [
      "Данные аккаунта: имя, номер телефона, (необязательно) email и имя пользователя.",
      "Пароль: хранится только в необратимо зашифрованном виде; исходный пароль не знаем даже мы.",
      "Активность: сохранённые рецепты, кулинарные книги, список покупок, история готовки, оценки и отзывы, статистика просмотров на сайте.",
      "Заказы: код заказа премиум-рецепта, цена, статус и (если вы согласны) ваши имя и телефон, которые отправляются автору.",
      "Загруженный вами контент: фото приготовленных блюд, данные профиля автора, фото и видео рецептов.",
      "Технические данные: сессионный cookie, число попыток входа для защиты (ваш адрес — в зашифрованном виде).",
    ] }] },
    { id: "maqsad", title: "3. Для чего мы их используем", body: [
      { list: [
        "Создавать аккаунт, обеспечивать вход и его безопасность.",
        "Показывать сохранённые рецепты, книги и историю.",
        "Передавать заказы премиум-рецептов автору и открывать рецепт после подтверждения оплаты.",
        "Улучшать сервис и предотвращать злоупотребления.",
      ] },
      "Мы не продаём ваши персональные данные и не передаём их третьим лицам в рекламных целях.",
    ] },
    { id: "kodlar", title: "4. Коды по email", body: [
      "Коды для восстановления пароля и подтверждения email мы отправляем письмом на ваш email (если вы его указали).",
      "Коды действуют недолго и используются только один раз. Номер телефона и email используются только для этих целей и для безопасности вашего аккаунта.",
    ] },
    { id: "ulashish", title: "5. Кому передаются данные", body: [
      { list: [
        "Автору рецепта — когда вы покупаете его премиум-рецепт: код заказа, цена и (если вы согласны) ваши имя и телефон. Сообщение через Telegram отправляете вы сами, поэтому к нему применяются и правила Telegram.",
        "Поставщику email-рассылки — для отправки кодов.",
        "Поставщикам хостинга, базы данных и хранения файлов — для хранения сайта, данных, фото и видео.",
      ] },
      "Эти поставщики обрабатывают данные только по нашему поручению. В случаях, предусмотренных законом, данные могут быть переданы уполномоченным государственным органам.",
    ] },
    { id: "cookie", title: "6. Cookie-файлы", body: ["Чтобы вы оставались в системе, мы используем сессионный cookie. Выбранный язык также запоминается в cookie. Рекламные и отслеживающие cookie не используются."] },
    { id: "muddat", title: "7. Как долго хранятся данные", body: ["Данные аккаунта хранятся, пока существует ваш аккаунт. При запросе на удаление данные удаляются, если закон не требует иного. Одноразовые коды и записи безопасности автоматически очищаются через короткое время."] },
    { id: "himoya", title: "8. Защита данных", body: ["Пароли шифруются, соединение защищено HTTPS, а коды не хранятся в открытом виде. Попытки входа ограничиваются. Тем не менее ни одна система не бывает безопасной на 100%; храните пароль в тайне."] },
    { id: "huquqlar", title: "9. Ваши права", body: [
      "В соответствии с законодательством Республики Узбекистан о персональных данных вы вправе:",
      { list: [
        "узнать, какие данные о вас обрабатываются, и получить их копию;",
        "исправить неточные данные (в настройках профиля вы можете сделать это сами);",
        "потребовать удаления данных или прекращения их обработки;",
        "отозвать согласие.",
      ] },
      `Направляйте запросы на ${MAIL}.`,
    ] },
    { id: "bolalar", title: "10. Дети", body: ["Сервис не предназначен для детей младше 14 лет. Если мы обнаружим такие данные, мы их удалим."] },
    { id: "ozgarishlar", title: "11. Изменения", body: ["Мы можем обновлять политику. Дата последнего обновления указана вверху страницы; о существенных изменениях мы сообщим на сайте."] },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: "Privacy policy",
  summary: "What data we collect, why we need it, how long we keep it and what you can control.",
  sections: [
    { id: "kim", title: "1. Who handles your data", body: [`Your personal data is processed by ${CO} (“Retseplar”, “we”). Contact: ${MAIL}.`] },
    { id: "yigamiz", title: "2. What data we collect", body: [{ list: [
      "Account details: name, phone number, (optional) email and username.",
      "Password: stored only in an irreversibly encrypted form; not even we know the original.",
      "Activity: saved recipes, cookbooks, shopping list, cooking history, ratings and reviews, and page-view statistics on the site.",
      "Orders: the premium recipe order code, price, status and (if you agree) your name and phone number, which are sent to the author.",
      "Content you upload: photos of dishes you cooked, creator profile details, recipe photos and videos.",
      "Technical data: a session cookie and the number of sign-in attempts for security (your address in encrypted form).",
    ] }] },
    { id: "maqsad", title: "3. What we use it for", body: [
      { list: [
        "To create your account and keep sign-in secure.",
        "To show your saved recipes, cookbooks and history.",
        "To pass premium recipe orders to the author and open the recipe once the payment is confirmed.",
        "To improve the service and prevent abuse.",
      ] },
      "We do not sell your personal data or give it to third parties for advertising.",
    ] },
    { id: "kodlar", title: "4. Email codes", body: [
      "If you added an email, we send password-reset and email-confirmation codes to it.",
      "Codes are valid for a short time and can be used only once. Your phone number and email are used only for these purposes and to keep your account secure.",
    ] },
    { id: "ulashish", title: "5. Who receives your data", body: [
      { list: [
        "The recipe's author, when you buy their premium recipe: the order code, price and (if you agree) your name and phone number. You send the message through Telegram yourself, so Telegram's rules also apply to it.",
        "Our email delivery provider, to send codes.",
        "Hosting, database and file storage providers, to store the site, data, photos and videos.",
      ] },
      "These providers process data only on our instructions. Where the law requires it, data may be disclosed to competent public authorities.",
    ] },
    { id: "cookie", title: "6. Cookies", body: ["We use a session cookie to keep you signed in. Your language choice is also remembered in a cookie. No advertising or tracking cookies are used."] },
    { id: "muddat", title: "7. How long we keep it", body: ["Account data is kept for as long as your account exists. When you ask for deletion, the data is erased unless the law requires otherwise. One-time codes and security records are cleared automatically after a short time."] },
    { id: "himoya", title: "8. How it is protected", body: ["Passwords are encrypted, the connection is protected with HTTPS and codes are not stored in readable form. Sign-in attempts are limited. Still, no system is 100% secure; keep your password secret."] },
    { id: "huquqlar", title: "9. Your rights", body: [
      "Under the personal-data legislation of the Republic of Uzbekistan you have the right to:",
      { list: [
        "know what data about you is processed and get a copy;",
        "correct inaccurate data (you can do this yourself in your profile settings);",
        "ask for your data to be deleted or its processing to stop;",
        "withdraw your consent.",
      ] },
      `Send your requests to ${MAIL}.`,
    ] },
    { id: "bolalar", title: "10. Children", body: ["The service is not intended for children under 14. If we find such data, we will delete it."] },
    { id: "ozgarishlar", title: "11. Changes", body: ["We may update this policy. The date of the last update is shown at the top of the page; we will announce significant changes on the site."] },
  ],
};

const PRIVACY_KZ: LegalDoc = {
  title: "Құпиялылық саясаты",
  summary: "Қандай деректерді жинаймыз, оларды не үшін қажет етеміз, қанша сақтаймыз және сіз нені басқара аласыз.",
  sections: [
    { id: "kim", title: "1. Деректеріңізді кім өңдейді", body: [`Жеке деректеріңізді ${CO} («Retseplar», «біз») өңдейді. Байланыс: ${MAIL}.`] },
    { id: "yigamiz", title: "2. Қандай деректерді жинаймыз", body: [{ list: [
      "Аккаунт деректері: аты, телефон нөмірі, (міндетті емес) email және пайдаланушы аты.",
      "Құпиясөз: тек қайтымсыз шифрланған түрде сақталады; бастапқы құпиясөзді біз де білмейміз.",
      "Белсенділік: сақталған рецепттер, аспаздық кітаптар, сатып алу тізімі, дайындау тарихы, бағалар мен пікірлер, сайттағы қаралым статистикасы.",
      "Тапсырыстар: премиум рецепт тапсырысының коды, бағасы, күйі және (келісім берсеңіз) авторға жіберілетін атыңыз бен телефоныңыз.",
      "Сіз жүктеген контент: дайындаған тағам суреттері, автор профилінің деректері, рецепт суреттері мен бейнелері.",
      "Техникалық деректер: сессия cookie-і, қауіпсіздік үшін кіру әрекеттерінің саны (мекенжайыңыз шифрланған түрде).",
    ] }] },
    { id: "maqsad", title: "3. Оларды не үшін қолданамыз", body: [
      { list: [
        "Аккаунтыңызды жасау, жүйеге кіруді және оның қауіпсіздігін қамтамасыз ету.",
        "Сақталған рецепттерді, кітаптарды және тарихты көрсету.",
        "Премиум рецепт тапсырыстарын авторға жеткізу және төлем расталғаннан кейін рецептті ашу.",
        "Қызметті жақсарту және теріс пайдаланудың алдын алу.",
      ] },
      "Жеке деректеріңізді сатпаймыз және жарнама мақсатында үшінші тұлғаларға бермейміз.",
    ] },
    { id: "kodlar", title: "4. Email кодтары", body: [
      "Құпиясөзді қалпына келтіру және email-ды растау кодтарын email-ыңызға (енгізген болсаңыз) хат арқылы жібереміз.",
      "Кодтар қысқа мерзім жарамды және тек бір рет қолданылады. Телефон нөмірі мен email тек осы мақсаттарда және аккаунтыңыздың қауіпсіздігі үшін қолданылады.",
    ] },
    { id: "ulashish", title: "5. Деректер кімге беріледі", body: [
      { list: [
        "Рецепт авторына — оның премиум рецептін сатып алғанда: тапсырыс коды, бағасы және (келісім берсеңіз) атыңыз бен телефоныңыз. Хабарламаны Telegram арқылы өзіңіз жібересіз, сондықтан оған Telegram ережелері де қолданылады.",
        "Email жеткізушіге — кодтарды жіберу үшін.",
        "Хостинг, деректер қоры және файл сақтау провайдерлеріне — сайтты, деректерді, суреттер мен бейнелерді сақтау үшін.",
      ] },
      "Бұл провайдерлер деректерді тек біздің тапсырмамызбен өңдейді. Заң талап еткен жағдайларда деректер құзыретті мемлекеттік органдарға берілуі мүмкін.",
    ] },
    { id: "cookie", title: "6. Cookie файлдары", body: ["Жүйеде қалуыңыз үшін сессия cookie-ін қолданамыз. Таңдаған тіліңіз де cookie-де есте сақталады. Жарнамалық немесе бақылау cookie-лері қолданылмайды."] },
    { id: "muddat", title: "7. Қанша уақыт сақталады", body: ["Аккаунт деректері аккаунтыңыз бар болғанша сақталады. Аккаунтты жою сұралғанда, заң басқаша талап етпесе, деректер өшіріледі. Бір реттік кодтар мен қауіпсіздік жазбалары қысқа мерзімнен кейін автоматты түрде тазаланады."] },
    { id: "himoya", title: "8. Деректерді қорғау", body: ["Құпиясөздер шифрланады, байланыс HTTPS арқылы қорғалады, ал кодтар ашық түрде сақталмайды. Жүйеге кіру әрекеттері шектеледі. Дегенмен ешбір жүйе 100% қауіпсіз емес; құпиясөзіңізді құпия ұстаңыз."] },
    { id: "huquqlar", title: "9. Сіздің құқықтарыңыз", body: [
      "Өзбекстан Республикасының жеке деректер туралы заңнамасына сәйкес сіз мынаған құқылысыз:",
      { list: [
        "өзіңіз туралы қандай деректер өңделетінін білуге және көшірмесін алуға;",
        "дұрыс емес деректерді түзетуге (профиль баптауларында өзіңіз жасай аласыз);",
        "деректерді жоюды немесе өңдеуді тоқтатуды сұрауға;",
        "келісімді кері қайтарып алуға.",
      ] },
      `Сұраныстарыңызды ${MAIL} мекенжайына жіберіңіз.`,
    ] },
    { id: "bolalar", title: "10. Балалар", body: ["Қызмет 14 жасқа толмаған балаларға арналмаған. Мұндай деректер анықталса, оларды жоямыз."] },
    { id: "ozgarishlar", title: "11. Өзгерістер", body: ["Саясатты жаңартуымыз мүмкін. Соңғы жаңарту күні беттің жоғарғы жағында көрсетіледі; маңызды өзгерістер туралы сайтта хабарлаймыз."] },
  ],
};

export const TERMS: Record<Locale, LegalDoc> = { uz: TERMS_UZ, ru: TERMS_RU, en: TERMS_EN, kz: TERMS_KZ };
export const PRIVACY: Record<Locale, LegalDoc> = { uz: PRIVACY_UZ, ru: PRIVACY_RU, en: PRIVACY_EN, kz: PRIVACY_KZ };
