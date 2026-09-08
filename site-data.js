const activityScheduleData = Object.freeze([
  {
    time: "8:30–9:00",
    datetime: "2026-10-03T08:30:00+08:00",
    title: "報到",
    description: "於龜殼劇場近停車場處核對會員身分，領取集章卡（限本會會員）。"
  },
  {
    time: "9:00–11:00",
    datetime: "2026-10-03T09:00:00+08:00",
    title: "健行集章",
    description: "依序走訪受信遺跡、榕樹聚落、客家工藝館三個集章點。"
  },
  {
    time: "10:30–11:30",
    datetime: "2026-10-03T10:30:00+08:00",
    title: "兌換禮品",
    description: "憑集章卡兌換伴手禮，10:30 起兌換，11:30 截止。"
  },
  {
    time: "11:00–11:30",
    datetime: "2026-10-03T11:00:00+08:00",
    title: "快樂賦歸",
    description: "活動結束，請協助維護場地與沿途環境整潔。"
  }
]);

const activityReminderData = Object.freeze([
  { text: "錄取名單預計於 9 月 18 日前公告於工會官網「最新消息」或 Facebook 粉絲專頁，並發送簡訊通知。" },
  { deadlineKey: "activityCancelDeadline", emailKey: "email", textBefore: "因故無法參加，請於", textAfter: "寄信至", textEnd: "，以利依序遞補。" },
  { text: "活動不開放現場候補或臨時報名；當天請攜帶會員卡或身分證件辦理報到。" },
  { text: "請自備水瓶，穿著舒適服裝、球鞋與遮陽衣物，並準備健保卡、個人藥品及防蚊用品。" },
  { text: "未請假缺席者，未來 4 個月內不得參加本會任何研習及活動；攜幼童者請全程注意孩童安全。" }
]);

const publicSiteUrl = "https://cagoooo.github.io/TeacherGroup2026/";

const usageAnalyticsConfig = Object.freeze({
  enabled: true,
  endpoint: "https://script.google.com/macros/s/AKfycbw4DsIoOtffczTawMQI7Pz9vO47-mWWLHSmNNHrmsXo4lq9BCxgtRxHxahwGl-ssk03/exec",
  provider: "gas-sheets",
  schema: 1,
  scope: "anonymous-aggregate",
  note: "只傳送固定事件名稱、網站版本及單次隨機請求碼；請求碼僅短暫去重，不傳送姓名、電話、名冊、付款資料、IP 或 User-Agent。"
});

const quickEntryData = Object.freeze([
  {
    id: "renewal",
    title: "舊會員續會",
    description: "查看本次 1,500 元收費與續會禮",
    href: "#renewal",
    qrUrl: `${publicSiteUrl}#renewal`,
    qrAsset: "assets/qr-renewal.png",
    icon: "bi-arrow-repeat",
    tone: "blue"
  },
  {
    id: "joining",
    title: "新進／中斷會員",
    description: "先洽支會長，由校內協助入會",
    href: "#joining",
    qrUrl: `${publicSiteUrl}#joining`,
    qrAsset: "assets/qr-joining.png",
    icon: "bi-person-plus-fill",
    tone: "green"
  },
  {
    id: "activities",
    title: "活動宣導",
    description: "查看 928 健行活動與報名提醒",
    href: "#activities",
    qrUrl: `${publicSiteUrl}#activities`,
    qrAsset: "assets/qr-activities.png",
    icon: "bi-sun-fill",
    tone: "gold"
  },
  {
    id: "contact",
    title: "聯絡方式",
    description: "支會長與工會秘書處聯繫入口",
    href: "#contact",
    qrUrl: `${publicSiteUrl}#contact`,
    qrAsset: "assets/qr-contact.png",
    icon: "bi-headset",
    tone: "red"
  }
]);

const announcementData = Object.freeze([
  {
    id: "workshops",
    title: "9、10 月學校多元研習",
    kind: "研習公告",
    summary: "三場研習依正式計畫辦理，請依 Google 表單或課程編號報名。",
    href: "#workshops",
    startsAt: "2026-09-04T00:00:00+08:00",
    archiveAt: "2026-10-18T00:00:00+08:00",
    dateLabel: "115 年 9 月 4 日公告",
    priority: 100,
    pinned: true
  },
  {
    id: "activities",
    title: "陽光親子 928 健行活動",
    kind: "活動公告",
    summary: "10 月 3 日崙坪文化地景園區健行、集章與兌換活動伴手禮。",
    href: "#activities",
    startsAt: "2026-09-03T00:00:00+08:00",
    archiveAt: "2026-10-04T00:00:00+08:00",
    dateLabel: "115 年 9 月 3 日公告",
    priority: 90,
    pinned: true
  },
  {
    id: "membership",
    title: "116 年度會員服務",
    kind: "會員公告",
    summary: "本次石門國小會員收費為 1,200 元＋300 元，合計 1,500 元。",
    href: "#renewal",
    startsAt: "2026-09-01T00:00:00+08:00",
    archiveAt: "2027-01-01T00:00:00+08:00",
    dateLabel: "116 年度",
    priority: 70,
    pinned: false
  }
]);

const workshopData = Object.freeze([
  {
    id: "film",
    cardClass: "workshop-card-film",
    month: "SEP",
    day: "24",
    weekday: "週四",
    ariaDate: "9月24日",
    tag: "電影欣賞・映後交流",
    title: "光影中的教育思辨：《野獸之心》",
    intro: "從人在極端處境中的韌性、創傷修復與生命選擇出發，連結生命教育、情意教育、動物倫理與媒體素養。",
    datetime: "2026-09-24T18:20:00+08:00",
    time: "115 年 9 月 24 日（星期四）18:20 報到；19:00 放映",
    venue: "星橋國際影城（桃園市中壢區中園路二段 501 號—大江購物中心）",
    audienceLabel: "對象",
    audience: "限桃園市教師；主、協辦單位會員優先，每位會員可帶 1 名眷屬",
    hours: "2 小時",
    registrationMode: "form",
    registrationUrl: "https://forms.gle/SupkcaojeeJzPb4RA",
    registrationLabel: "前往 Google 表單",
    registrationStartsAt: "2026-09-07T12:30:00+08:00",
    registrationEndsAt: "2026-09-11T16:00:00+08:00",
    registrationWindow: "9/7（一）12:30～9/11（五）16:00",
    registrationNote: "止，額滿即關閉；錄取後再依通知至研習系統完成報名。"
  },
  {
    id: "community",
    cardClass: "workshop-card-community",
    month: "OCT",
    day: "03",
    weekday: "週六",
    ariaDate: "10月3日",
    tag: "學習共同體・共備實作",
    title: "學習共同體進階：從共備到課堂實踐",
    intro: "深化教材研讀、學習證據分析與課堂設計，透過案例剖析、分組共備及成果分享，將共備成果落實於課堂。",
    datetime: "2026-10-03T09:00:00+08:00",
    time: "115 年 10 月 3 日（星期六）上午 9:00～下午 4:30",
    venue: "桃園市蘆竹區大華國民小學圖書館（桃園市蘆竹區大華街 98 號）",
    audienceLabel: "名額",
    audience: "限額 30 位；曾參加學習共同體基礎研習者優先",
    hours: "8 小時",
    registrationMode: "course",
    courseCode: "Z00002-260800001",
    registrationStartsAt: "2026-09-04T00:00:00+08:00",
    registrationEndsAt: "2026-09-29T16:00:00+08:00",
    eventEndsAt: "2026-10-03T16:30:00+08:00",
    registrationWindow: "即日起～9/29（二）16:00",
    registrationNote: "止，請至桃園市教師研習系統以課程編號報名。"
  },
  {
    id: "bee",
    cardClass: "workshop-card-bee",
    month: "OCT",
    day: "17",
    weekday: "週六",
    ariaDate: "10月17日",
    tag: "生態教育・造型黏土 DIY",
    title: "蜂與自然：蜜蜂生態教育暨造型黏土 DIY",
    intro: "認識蜜蜂生態、授粉與蜜源植物，走進蜂園觀察，再以造型黏土創作延伸自然與藝術課程。",
    datetime: "2026-10-17T13:00:00+08:00",
    time: "115 年 10 月 17 日（星期六）下午 1:00～4:30",
    venue: "驛品香生態農園（桃園市楊梅區永寧里 1 鄰校前路 1150 號）",
    audienceLabel: "名額",
    audience: "本市教師；主、協辦單位會員優先，限額 30 位",
    hours: "4 小時",
    registrationMode: "course",
    courseCode: "Z00002-260900001",
    registrationStartsAt: "2026-09-04T00:00:00+08:00",
    registrationEndsAt: "2026-10-08T16:00:00+08:00",
    eventEndsAt: "2026-10-17T16:30:00+08:00",
    registrationWindow: "即日起～10/8（四）16:00",
    registrationNote: "止，請至桃園市教師研習系統以課程編號報名。"
  }
]);

const workshopFieldMap = Object.freeze({
  workshopFilmTitle: workshopData[0].title,
  workshopFilmTime: workshopData[0].time,
  workshopFilmVenue: workshopData[0].venue,
  workshopFilmHours: workshopData[0].hours,
  workshopFilmRegistrationWindow: workshopData[0].registrationWindow,
  workshopFilmRegistrationUrl: workshopData[0].registrationUrl,
  workshopCommunityTitle: workshopData[1].title,
  workshopCommunityTime: workshopData[1].time,
  workshopCommunityVenue: workshopData[1].venue,
  workshopCommunityHours: workshopData[1].hours,
  workshopCommunityCourseCode: workshopData[1].courseCode,
  workshopCommunityRegistrationWindow: workshopData[1].registrationWindow,
  workshopBeeTitle: workshopData[2].title,
  workshopBeeTime: workshopData[2].time,
  workshopBeeVenue: workshopData[2].venue,
  workshopBeeHours: workshopData[2].hours,
  workshopBeeCourseCode: workshopData[2].courseCode,
  workshopBeeRegistrationWindow: workshopData[2].registrationWindow
});

window.SITE_CONFIG = Object.freeze({
  campaignYear: "115",
  membershipYear: "116",
  annualFee: "1,200",
  joinFee: "1,200",
  recreationFee: "300",
  currentCollectionTotal: "1,500",
  fullFee: "2,400",
  earlyVoucher: "200",
  lateVoucher: "100",
  accountName: "桃園市教育產業工會",
  bankCode: "700",
  bankAccount: "0281063-0703178",
  phone: "03-458-3860",
  fax: "03-458-3672",
  email: "teuniontw@gmail.com",
  publicSiteUrl,
  quickEntries: quickEntryData,
  announcements: announcementData,
  pwaHealthUrl: "pwa-health.html",
  usageStatsUrl: "usage-stats.html",
  usageAnalytics: usageAnalyticsConfig,
  brandAssetManifest: "brand-assets.json",
  activityTitle: "陽光親子 928 健行活動",
  activitySeries: "第一波｜教師節活動",
  activityDateLabel: "115 年 10 月 3 日（星期六）",
  activityTimeLabel: "上午 8:30–11:30",
  activityVenue: "崙坪文化地景園區",
  activityAddress: "桃園市觀音區崙坪里 16 鄰學府路 350 巷 120 號",
  activityParking: "崙坪生態停車場",
  activityParkingAddress: "桃園市觀音區崙坪里忠愛路一段 378 巷 60 號",
  activityRegistrationWindow: "9/7（一）13:00～9/16（三）13:00",
  activityEligibility: "已繳交 115 年會費或預繳 116 年會費之會員",
  activityMemberLimit: "會員 200 人，眷屬另計",
  activityFamilyLimit: "每名會員最多攜眷 3 人",
  activityTrainingHours: "3 小時",
  activityRegistrationUrl: "https://reurl.cc/Ym4k44",
  activityInfoUrl: "https://reurl.cc/OQYEp7",
  activityRegistrationStartsAt: "2026-09-07T13:00:00+08:00",
  activityRegistrationEndsAt: "2026-09-16T13:00:00+08:00",
  activityEventEndsAt: "2026-10-03T11:30:00+08:00",
  activityCancelDeadline: "9/21（一）前",
  activitySchedule: activityScheduleData,
  activityReminders: activityReminderData,
  workshops: workshopData,
  workshopTitle: "115 年度學校多元研習",
  workshopAnnouncementLabel: "9、10 月學校多元研習",
  workshopAnnouncementDate: "115 年 9 月 4 日公文",
  ...workshopFieldMap,
  officialWebsite: "https://www.teu.org.tw/",
  emailLink: "mailto:teuniontw@gmail.com"
});
