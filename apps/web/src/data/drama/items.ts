import type { Drama } from "./types";

// K-드라마 가이드 24편 (P6 데이터). 작성 2026-10-19.
// 확인 방법
// - year·episodes·network·cast·role: 영문 위키백과 문서(sources 의 en.wikipedia 링크) + 위키데이터 P580·P1113·P449·P161 교차 확인.
// - wikidataId·cast.entityId: wbsearchentities / wbgetentities(sites=enwiki) 로 확인한 Q-id 만 넣었다.
// - watch: 플랫폼 공식 작품 페이지를 직접 열어 제목을 확인한 것만. regions 는 공식 문서에 지역이 적힌 경우만(프라임 보도자료).
// - filmingPlaces: travel/items.ts 에 있는 명소 slug 만. 명소 related.dramas 와 서로 가리킨다. 줄 위 주석이 근거 출처다.
//   (VK = english.visitkorea.or.kr 한국관광공사, VS = visitseoul.net 서울관광재단, VJ = visitjeju.net 제주관광공사, KN = korea.net, MH = mediahub.seoul.go.kr 서울시)
//   '여행 목록 밖' 은 공식 출처로 확인했지만 여행 명소에 없어 뺀 촬영지 — 명소를 추가할 때 연결 후보다. 확인 못 한 작품은 빈 배열.
// - similar: 이 목록 안의 drama slug 만.

export const DRAMA_ITEMS: Drama[] = [
  // ───────── 최근작 (2023~2026) 13편 ─────────
  {
    slug: "queen-of-tears",
    year: 2024, episodes: 16, network: "tvN",
    genres: ["romance", "comedy", "melodrama"],
    wikidataId: "Q116921048",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81707950" }],
    cast: [
      { name: "Kim Soo-hyun", entityId: "Q496491", role: "Baek Hyun-woo" },
      { name: "Kim Ji-won", entityId: "Q2680695", role: "Hong Hae-in" },
      { name: "Park Sung-hoon", entityId: "Q22973857", role: "Yoon Eun-sung" },
      { name: "Kwak Dong-yeon", entityId: "Q12584846", role: "Hong Soo-cheol" },
      { name: "Lee Joo-bin", entityId: "Q61955498", role: "Cheon Da-hye" },
    ],
    // the-hyundai-seoul: VS SOUL SPOT(2024-09) / 여행 목록 밖: 우리옛돌박물관(VS SOUL SPOT), 청계광장·광통교(VS go!Seoul 2024.07), 그랜드 워커힐 애스턴하우스(VK 'Hocance')
    filmingPlaces: ["the-hyundai-seoul"],
    similar: ["crash-landing-on-you", "king-the-land", "business-proposal"],
    icon: "crown",
    editorialScore: 93, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81707950",
      "https://en.wikipedia.org/wiki/Queen_of_Tears",
      "https://english.visitseoul.net/hallyu/K-SoulSpot_/47001",
    ],
  },
  {
    slug: "lovely-runner",
    year: 2024, episodes: 16, network: "tvN",
    genres: ["romance", "fantasy", "comedy", "youth"],
    wikidataId: "Q121144610",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81914565" }],
    cast: [
      { name: "Byeon Woo-seok", entityId: "Q55730330", role: "Ryu Sun-jae" },
      { name: "Kim Hye-yoon", entityId: "Q60679665", role: "Im Sol" },
      { name: "Song Geon-hee", entityId: "Q61100494", role: "Kim Tae-seong" },
      { name: "Lee Seung-hyub", entityId: "Q18230780", role: "Baek In-hyuk" },
    ],
    // bukchon-hanok-village(복정우물)·choong-ang-high-school: MH 2024-06-14 '선업튀·눈물의여왕 서울 속 촬영지' / 여행 목록 밖: 성수낙낙(VS go!Seoul 2025.08), 수원 화홍문·행리단길(VK)
    filmingPlaces: ["bukchon-hanok-village", "choong-ang-high-school"],
    similar: ["twenty-five-twenty-one", "true-beauty", "our-beloved-summer"],
    icon: "umbrella",
    editorialScore: 94, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81914565",
      "https://en.wikipedia.org/wiki/Lovely_Runner",
      "https://english.visitkorea.or.kr/svc/whereToGo/hdrdslt/hdrdsltView.do?crsSn=564819",
      "https://mediahub.seoul.go.kr/archives/2011402",
    ],
  },
  {
    slug: "when-life-gives-you-tangerines",
    year: 2025, episodes: 16, network: "Netflix",
    genres: ["family", "romance", "melodrama"],
    wikidataId: "Q117353211",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81681535" }],
    cast: [
      { name: "IU", entityId: "Q20145", role: "Oh Ae-sun" },
      { name: "Park Bo-gum", entityId: "Q15977222", role: "Yang Gwan-sik" },
      { name: "Moon So-ri", entityId: "Q456182", role: "Oh Ae-sun (middle-aged)" },
      { name: "Park Hae-joon", entityId: "Q18381077", role: "Yang Gwan-sik (middle-aged)" },
      { name: "Yeom Hye-ran", entityId: "Q28700264", role: "Jeon Gwang-rye" },
    ],
    // seongsan-ilchulbong(2화): VJ 'Netflix's latest sensation, When Life Gives You Tangerines'(2025-04-15) / 여행 목록 밖(같은 출처): 1·3화 김녕, 8화 제주목 관아, 12화 생이기정, 14화 한림항
    filmingPlaces: ["seongsan-ilchulbong"],
    similar: ["reply-1988", "our-unwritten-seoul", "twenty-five-twenty-one"],
    icon: "tangerine",
    editorialScore: 95, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81681535",
      "https://en.wikipedia.org/wiki/When_Life_Gives_You_Tangerines",
      "https://www.visitjeju.net/en/detail/view?contentsid=CNTS_300000000013461",
    ],
  },
  {
    slug: "king-the-land",
    year: 2023, episodes: 16, network: "JTBC",
    genres: ["romance", "comedy"],
    wikidataId: "Q114243955",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81671440" }],
    cast: [
      { name: "Lee Jun-ho", entityId: "Q488423", role: "Gu Won" },
      { name: "Lim Yoona", entityId: "Q466975", role: "Cheon Sa-rang" },
      { name: "Go Won-hee", entityId: "Q15140731", role: "Oh Pyung-hwa" },
      { name: "Kim Ga-eun", entityId: "Q12586858", role: "Kang Da-eul" },
      { name: "Ahn Se-ha", entityId: "Q17346185", role: "Noh Sang-sik" },
    ],
    // 여행 목록 밖: 파르나스 호텔 제주 로비(VK 'Hocance to K-Drama Filming Locations')
    filmingPlaces: [],
    similar: ["business-proposal", "queen-of-tears", "love-next-door"],
    icon: "hotel",
    editorialScore: 82, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81671440",
      "https://en.wikipedia.org/wiki/King_the_Land",
      "https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=862&vcontsId=201097",
    ],
  },
  {
    slug: "my-demon",
    year: 2023, episodes: 16, network: "SBS",
    genres: ["romance", "fantasy", "comedy"],
    wikidataId: "Q120721044",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81716080" }],
    cast: [
      { name: "Kim You-jung", entityId: "Q486320", role: "Do Do-hee" },
      { name: "Song Kang", entityId: "Q41777221", role: "Jeong Gu-won" },
      { name: "Lee Sang-yi", entityId: "Q12611661", role: "Joo Seok-hoon" },
      { name: "Kim Hae-sook", entityId: "Q484471", role: "Joo Cheon-sook" },
    ],
    filmingPlaces: [], // 공식 관광 자료로 확인한 촬영지 없음
    similar: ["goblin", "hotel-del-luna", "bon-appetit-your-majesty"],
    icon: "devil",
    editorialScore: 80, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81716080",
      "https://en.wikipedia.org/wiki/My_Demon",
    ],
  },
  {
    slug: "marry-my-husband",
    year: 2024, episodes: 16, network: "tvN",
    genres: ["romance", "fantasy", "melodrama"],
    wikidataId: "Q123181328",
    watch: [
      // 아마존 MGM 보도자료: "Country Availability: Worldwide (Excluding Mainland China & South Korea)"
      { platform: "prime", url: "https://www.primevideo.com/detail/0U9LVA2T8NCPW1W1B51AGU7KCR", regions: ["tw", "hk", "jp", "us", "sg", "my", "ph", "id", "vn", "fr"] },
      { platform: "tving", url: "https://www.tving.com/contents/P001749924" },
    ],
    cast: [
      { name: "Park Min-young", entityId: "Q242673", role: "Kang Ji-won" },
      { name: "Na In-woo", entityId: "Q21040300", role: "Yoo Ji-hyuk" },
      { name: "Lee Yi-kyung", entityId: "Q12612362", role: "Park Min-hwan" },
      { name: "Song Ha-yoon", entityId: "Q626531", role: "Jeong Su-min" },
      { name: "Lee Gi-kwang", entityId: "Q10919869", role: "Baek Eun-ho" },
    ],
    // 여행 목록 밖: 청계광장·광통교(VS go!Seoul 2024.07), 노들섬(VS SOUL SPOT 2024-09)
    filmingPlaces: [],
    similar: ["queen-of-tears", "lovely-runner", "when-the-phone-rings"],
    icon: "ring",
    editorialScore: 86, addedAt: "2026-10-19",
    sources: [
      "https://www.primevideo.com/detail/0U9LVA2T8NCPW1W1B51AGU7KCR",
      "https://press.amazonmgmstudios.com/us/en/original-series/marry-my-husband/1",
      "https://www.tving.com/contents/P001749924",
      "https://en.wikipedia.org/wiki/Marry_My_Husband",
    ],
  },
  {
    slug: "doctor-slump",
    year: 2024, episodes: 16, network: "JTBC",
    genres: ["romance", "comedy", "medical"],
    wikidataId: "Q117219597",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81697985" }],
    cast: [
      { name: "Park Hyung-sik", entityId: "Q6757073", role: "Yeo Jeong-woo" },
      { name: "Park Shin-hye", entityId: "Q497785", role: "Nam Ha-neul" },
      { name: "Yoon Park", entityId: "Q16090632", role: "Bin Dae-yeong" },
      { name: "Jang Hye-jin", entityId: "Q55733858", role: "Kong Wol-seon" },
    ],
    filmingPlaces: [], // 위키백과의 촬영지 문단은 각주가 없어 쓰지 않았다
    similar: ["love-next-door", "resident-playbook", "our-beloved-summer"],
    icon: "stethoscope",
    editorialScore: 78, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81697985",
      "https://en.wikipedia.org/wiki/Doctor_Slump_(TV_series)",
    ],
  },
  {
    slug: "love-next-door",
    year: 2024, episodes: 16, network: "tvN",
    genres: ["romance", "comedy", "family"],
    wikidataId: "Q124326709",
    watch: [
      { platform: "netflix", url: "https://www.netflix.com/title/81739044" },
      { platform: "tving", url: "https://www.tving.com/contents/P001759473" },
    ],
    cast: [
      { name: "Jung Hae-in", entityId: "Q17504174", role: "Choi Seung-hyo" },
      { name: "Jung So-min", entityId: "Q170001", role: "Bae Seok-ryu" },
      { name: "Kim Ji-eun", entityId: "Q55736775", role: "Jeong Mo-eum" },
      { name: "Yoon Ji-on", entityId: "Q59381487", role: "Kang Dan-ho" },
    ],
    filmingPlaces: [], // 공식 관광 자료로 확인한 촬영지 없음
    similar: ["our-beloved-summer", "doctor-slump", "reply-1988"],
    icon: "housing",
    editorialScore: 83, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81739044",
      "https://www.tving.com/contents/P001759473",
      "https://en.wikipedia.org/wiki/Love_Next_Door",
    ],
  },
  {
    slug: "when-the-phone-rings",
    year: 2024, episodes: 12, network: "MBC",
    genres: ["romance", "thriller", "mystery"],
    wikidataId: "Q130258195",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81912961" }],
    cast: [
      { name: "Yoo Yeon-seok", entityId: "Q77621", role: "Baek Sa-eon" },
      { name: "Chae Soo-bin", entityId: "Q18815764", role: "Hong Hee-joo" },
      { name: "Heo Nam-jun", entityId: "Q107109848", role: "Ji Sang-woo" },
      { name: "Jang Gyu-ri", entityId: "Q53334919", role: "Na Yu-ri" },
    ],
    filmingPlaces: [], // 공식 관광 자료로 확인한 촬영지 없음
    similar: ["marry-my-husband", "my-demon", "crash-landing-on-you"],
    icon: "telephone",
    editorialScore: 85, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81912961",
      "https://en.wikipedia.org/wiki/When_the_Phone_Rings",
    ],
  },
  {
    slug: "bon-appetit-your-majesty",
    year: 2025, episodes: 12, network: "tvN",
    genres: ["romance", "fantasy", "historical", "comedy"],
    wikidataId: "Q131910461",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/82024852" }],
    cast: [
      { name: "Lim Yoona", entityId: "Q466975", role: "Yeon Ji-yeong" },
      { name: "Lee Chae-min", entityId: "Q107109595", role: "Lee Heon" },
      { name: "Kang Han-na", entityId: "Q16080045", role: "Kang Mok-ju" },
      { name: "Choi Gwi-hwa", entityId: "Q18815772", role: "Prince Je Seon" },
      { name: "Yoon Seo-ah", entityId: "Q63252838", role: "Seo Gil-geum" },
    ],
    // 여행 목록 밖: 쁘띠프랑스 '마리의 집'(가평, VK), 벽초지수목원(파주, VK 'Paju Drama Road')
    filmingPlaces: [],
    similar: ["hotel-del-luna", "lovely-runner", "my-demon"],
    icon: "cooking",
    editorialScore: 88, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/82024852",
      "https://en.wikipedia.org/wiki/Bon_App%C3%A9tit,_Your_Majesty",
      "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=93730",
    ],
  },
  {
    slug: "our-unwritten-seoul",
    year: 2025, episodes: 12, network: "tvN",
    genres: ["romance", "family"],
    wikidataId: "Q131393572",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/82024804" }],
    cast: [
      { name: "Park Bo-young", entityId: "Q490918", role: "Yoo Mi-ji / Yoo Mi-rae" },
      { name: "Park Jin-young", entityId: "Q492313", role: "Lee Ho-soo" },
      { name: "Ryu Kyung-soo", entityId: "Q61959900", role: "Han Se-jin" },
      { name: "Jang Young-nam", entityId: "Q498061", role: "Kim Ok-hee" },
    ],
    // ikseon-dong-hanok-street(첫 데이트): VS go!Seoul 2025.08 / 여행 목록 밖: 성수낙낙(동창 모임, 같은 출처)
    filmingPlaces: ["ikseon-dong-hanok-street"],
    similar: ["when-life-gives-you-tangerines", "love-next-door", "twenty-five-twenty-one"],
    icon: "mirror",
    editorialScore: 87, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/82024804",
      "https://en.wikipedia.org/wiki/Our_Unwritten_Seoul",
      "https://korean.visitseoul.net/partners-kr/goSeoulNewsletter/13957_/13957",
    ],
  },
  {
    slug: "resident-playbook",
    year: 2025, episodes: 12, network: "tvN",
    genres: ["medical", "youth", "comedy"],
    wikidataId: "Q122854712",
    watch: [
      { platform: "netflix", url: "https://www.netflix.com/title/81739042" },
      { platform: "tving", url: "https://www.tving.com/contents/P001768976" },
    ],
    cast: [
      { name: "Go Youn-jung", entityId: "Q97210760", role: "Oh Yi-young" },
      { name: "Shin Si-ah", entityId: "Q107395839", role: "Pyo Nam-kyung" },
      { name: "Kang You-seok", entityId: "Q97657525", role: "Um Jae-il" },
      { name: "Jung Joon-won", entityId: "Q60059587", role: "Ku Do-won" },
      { name: "Kim Hye-in", entityId: "Q23996147", role: "Myung Eun-won" },
    ],
    filmingPlaces: [], // 공식 관광 자료로 확인한 촬영지 없음
    similar: ["extraordinary-attorney-woo", "doctor-slump", "start-up"],
    icon: "hospital",
    editorialScore: 80, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81739042",
      "https://www.tving.com/contents/P001768976",
      "https://en.wikipedia.org/wiki/Resident_Playbook",
    ],
  },
  {
    slug: "can-this-love-be-translated",
    year: 2026, episodes: 12, network: "Netflix",
    genres: ["romance", "comedy"],
    wikidataId: "Q125121395",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81697769" }],
    cast: [
      { name: "Kim Seon-ho", entityId: "Q37565564", role: "Joo Ho-jin" },
      { name: "Go Youn-jung", entityId: "Q97210760", role: "Cha Mu-hee" },
      { name: "Sota Fukushi", entityId: "Q6120300", role: "Hiro Kurosawa" },
      { name: "Lee E-dam", entityId: "Q109535522", role: "Shin Ji-seon" },
      { name: "Choi Woo-sung", entityId: "Q106514783", role: "Kim Yong-u" },
    ],
    filmingPlaces: [], // 한국·일본·캐나다·이탈리아 촬영(위키백과). 국내 장소는 공식 자료로 확인 못 함
    similar: ["business-proposal", "king-the-land", "start-up"],
    icon: "speech",
    editorialScore: 84, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81697769",
      "https://en.wikipedia.org/wiki/Can_This_Love_Be_Translated%3F",
    ],
  },

  // ───────── 입문 명작 11편 ─────────
  {
    slug: "crash-landing-on-you",
    year: 2019, episodes: 16, network: "tvN",
    genres: ["romance", "comedy", "melodrama"],
    wikidataId: "Q65258113",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81159258" }],
    cast: [
      { name: "Hyun Bin", entityId: "Q380118", role: "Ri Jeong-hyeok" },
      { name: "Son Ye-jin", entityId: "Q256932", role: "Yoon Se-ri" },
      { name: "Kim Jung-hyun", entityId: "Q27952702", role: "Gu Seung-jun" },
      { name: "Seo Ji-hye", entityId: "Q491625", role: "Seo Dan" },
    ],
    // 여행 목록 밖: 아라동 역사문화탐방로(제주)·중앙탑공원(충주)(VK 'It's Okay to Crash Land on Itaewon in Beloved Summer'), 비내섬(충주, KN)
    filmingPlaces: [],
    similar: ["queen-of-tears", "goblin", "king-the-land"],
    icon: "parachute",
    editorialScore: 94, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81159258",
      "https://en.wikipedia.org/wiki/Crash_Landing_on_You",
      "https://english.visitkorea.or.kr/enu/ATR/SI_EN_3_9.jsp?cid=2819883",
    ],
  },
  {
    slug: "goblin",
    year: 2016, episodes: 16, network: "tvN",
    genres: ["fantasy", "romance", "melodrama"],
    wikidataId: "Q24859151",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81012510" }],
    cast: [
      { name: "Gong Yoo", entityId: "Q623436", role: "Kim Shin" },
      { name: "Kim Go-eun", entityId: "Q6408653", role: "Ji Eun-tak" },
      { name: "Lee Dong-wook", entityId: "Q494714", role: "Grim Reaper" },
      { name: "Yoo In-na", entityId: "Q491413", role: "Sunny" },
      { name: "Yook Sung-jae", entityId: "Q16171180", role: "Yoo Deok-hwa" },
    ],
    // ikseon-dong-hanok-street: VS go!Seoul 2025.08 / 여행 목록 밖: 운현궁 양관(현재 닫힘)·일감호(VS 'Fantastical Scenes from Goblin'), 감고당길(VS go!Seoul 2024.07), 주문진 영진해변(KN)
    filmingPlaces: ["ikseon-dong-hanok-street"],
    similar: ["hotel-del-luna", "my-demon", "crash-landing-on-you"],
    icon: "candle",
    editorialScore: 92, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81012510",
      "https://en.wikipedia.org/wiki/Guardian:_The_Lonely_and_Great_God",
      "https://english.visitseoul.net/tours/fantastical-scenes-from-goblin-the-lonely-and-great-god_/21705",
      "https://korean.visitseoul.net/partners-kr/goSeoulNewsletter/13957_/13957",
    ],
  },
  {
    slug: "itaewon-class",
    year: 2020, episodes: 16, network: "JTBC",
    genres: ["youth", "romance"],
    wikidataId: "Q65283099",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81193309" }],
    cast: [
      { name: "Park Seo-joon", entityId: "Q5116234", role: "Park Sae-ro-yi" },
      { name: "Kim Da-mi", entityId: "Q56327848", role: "Jo Yi-seo" },
      { name: "Yoo Jae-myung", entityId: "Q17487457", role: "Jang Dae-hee" },
      { name: "Kwon Nara", entityId: "Q14493927", role: "Oh Soo-ah" },
      { name: "Ahn Bo-hyun", entityId: "Q22974399", role: "Jang Geun-won" },
    ],
    // noksapyeong-overpass(6화): VK '"Itaewon Class" Filming Locations'(2023-10-13) / 여행 목록 밖(같은 출처): 단밤(SEOUL BAM), 이태원 어린이공원, 남산 백범광장
    filmingPlaces: ["noksapyeong-overpass"],
    similar: ["start-up", "our-beloved-summer", "extraordinary-attorney-woo"],
    icon: "beer",
    editorialScore: 85, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81193309",
      "https://en.wikipedia.org/wiki/Itaewon_Class",
      "https://english.visitkorea.or.kr/svc/sp/HallyuNew/contentsView.do?dataSetId=76&vcontsId=177276",
    ],
  },
  {
    slug: "hotel-del-luna",
    year: 2019, episodes: 16, network: "tvN",
    genres: ["fantasy", "romance", "comedy"],
    wikidataId: "Q61981835",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81205849" }],
    cast: [
      { name: "IU", entityId: "Q20145", role: "Jang Man-wol" },
      { name: "Yeo Jin-goo", entityId: "Q486338", role: "Gu Chan-sung" },
      { name: "Jung Dong-hwan", entityId: "Q11269962", role: "Noh Joon-suk" },
      { name: "Shin Jung-geun", entityId: "Q12604561", role: "Kim Seon-bi" },
      { name: "Bae Hae-sun", entityId: "Q20947692", role: "Choi Seo-hee" },
    ],
    // ikseon-dong-hanok-street: VS go!Seoul 2024.07 — 새서울(옛 호텔 세느, 돈화문로11길 28-5, 익선동) / 여행 목록 밖: 혜민당(중구, 같은 출처), 가림성(부여, KN)
    filmingPlaces: ["ikseon-dong-hanok-street"],
    similar: ["goblin", "my-demon", "bon-appetit-your-majesty"],
    icon: "moon",
    editorialScore: 89, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81205849",
      "https://en.wikipedia.org/wiki/Hotel_del_Luna",
      "https://english.visitseoul.net/partners-en/goSeoulNewsletter/13961_/13961",
    ],
  },
  {
    slug: "extraordinary-attorney-woo",
    year: 2022, episodes: 16, network: "ENA",
    genres: ["legal", "comedy", "romance"],
    wikidataId: "Q110118400",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81518991" }],
    cast: [
      { name: "Park Eun-bin", entityId: "Q491387", role: "Woo Young-woo" },
      { name: "Kang Tae-oh", entityId: "Q16177775", role: "Lee Joon-ho" },
      { name: "Kang Ki-young", entityId: "Q19349195", role: "Jung Myung-seok" },
      { name: "Ha Yoon-kyung", entityId: "Q27952830", role: "Choi Soo-yeon" },
      { name: "Joo Jong-hyuk", entityId: "Q105706592", role: "Kwon Min-woo" },
    ],
    // ikseon-dong-hanok-street: VS go!Seoul 2024.07 — 새서울 아케이드(익선동) / 여행 목록 밖: 함덕해수욕장·관음사(13·14화 '황지사')·새연교(VK 'Extraordinary Jeju Filming Spots')
    filmingPlaces: ["ikseon-dong-hanok-street"],
    similar: ["resident-playbook", "start-up", "itaewon-class"],
    icon: "whale",
    editorialScore: 90, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81518991",
      "https://en.wikipedia.org/wiki/Extraordinary_Attorney_Woo",
      "https://english.visitkorea.or.kr/svc/whereToGo/hdrdslt/hdrdsltView.do?crsSn=396342&menuSn=217",
      "https://english.visitseoul.net/partners-en/goSeoulNewsletter/13961_/13961",
    ],
  },
  {
    slug: "business-proposal",
    year: 2022, episodes: 12, network: "SBS",
    genres: ["romance", "comedy"],
    wikidataId: "Q108486931",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81509440" }],
    cast: [
      { name: "Ahn Hyo-seop", entityId: "Q24000262", role: "Kang Tae-moo" },
      { name: "Kim Se-jeong", entityId: "Q22911780", role: "Shin Ha-ri" },
      { name: "Kim Min-kyu", entityId: "Q22973125", role: "Cha Sung-hoon" },
      { name: "Seol In-ah", entityId: "Q30138752", role: "Jin Young-seo" },
    ],
    // 여행 목록 밖: 서울공예박물관 앞(노란 우산 장면)·연남장(VS 'the drama that stimulates your love cells'), 스카이베이 호텔 경포(강릉, VK 'Hocance')
    filmingPlaces: [],
    similar: ["king-the-land", "true-beauty", "can-this-love-be-translated"],
    icon: "jobs",
    editorialScore: 88, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81509440",
      "https://en.wikipedia.org/wiki/Business_Proposal",
      "https://english.visitseoul.net/hallyu/the-drama-that-stimulates-your-love-cells_/41170",
    ],
  },
  {
    slug: "twenty-five-twenty-one",
    year: 2022, episodes: 16, network: "tvN",
    genres: ["youth", "romance"],
    wikidataId: "Q108809568",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81517168" }],
    cast: [
      { name: "Kim Tae-ri", entityId: "Q21575818", role: "Na Hee-do" },
      { name: "Nam Joo-hyuk", entityId: "Q17500112", role: "Baek Yi-jin" },
      { name: "Bona", entityId: "Q28870936", role: "Ko Yu-rim" },
      { name: "Choi Hyun-wook", entityId: "Q96625460", role: "Moon Ji-woong" },
      { name: "Lee Ju-myoung", entityId: "Q97224484", role: "Ji Seung-wan" },
    ],
    // 여행 목록 밖: 수원 화성 남포루(VK 'Today, I'm the Heroine of a K-drama')
    filmingPlaces: [],
    similar: ["lovely-runner", "reply-1988", "our-beloved-summer"],
    icon: "fencing",
    editorialScore: 90, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81517168",
      "https://en.wikipedia.org/wiki/Twenty-Five_Twenty-One",
      "https://english.visitkorea.or.kr/svc/sp/HallyuNew/contentsView.do?dataSetId=76&vcontsId=228261",
    ],
  },
  {
    slug: "true-beauty",
    year: 2020, episodes: 16, network: "tvN",
    genres: ["romance", "comedy", "youth"],
    wikidataId: "Q65272745",
    watch: [
      { platform: "netflix", url: "https://www.netflix.com/title/81410834" },
      { platform: "tving", url: "https://www.tving.com/contents/P001391055" },
    ],
    cast: [
      { name: "Moon Ga-young", entityId: "Q12968338", role: "Lim Ju-kyung" },
      { name: "Cha Eun-woo", entityId: "Q21060390", role: "Lee Su-ho" },
      { name: "Hwang In-youp", entityId: "Q76823543", role: "Han Seo-jun" },
      { name: "Park Yoo-na", entityId: "Q31179298", role: "Kang Su-jin" },
    ],
    // 여행 목록 밖: 감고당길(VS go!Seoul 2024.07)
    filmingPlaces: [],
    similar: ["business-proposal", "lovely-runner", "twenty-five-twenty-one"],
    icon: "kbeauty",
    editorialScore: 84, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81410834",
      "https://www.tving.com/contents/P001391055",
      "https://en.wikipedia.org/wiki/True_Beauty_(South_Korean_TV_series)",
    ],
  },
  {
    slug: "our-beloved-summer",
    year: 2021, episodes: 16, network: "SBS",
    genres: ["romance", "youth", "comedy"],
    wikidataId: "Q107474096",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81486372" }],
    cast: [
      { name: "Choi Woo-shik", entityId: "Q492701", role: "Choi Ung" },
      { name: "Kim Da-mi", entityId: "Q56327848", role: "Kook Yeon-soo" },
      { name: "Kim Sung-cheol", entityId: "Q12587761", role: "Kim Ji-ung" },
      { name: "Roh Jeong-eui", entityId: "Q12590448", role: "NJ" },
    ],
    // 여행 목록 밖: 감고당길(VS go!Seoul 2024.07), 수원 행궁동·화성 궁평항(VK 'It's Okay to Crash Land on Itaewon in Beloved Summer')
    filmingPlaces: [],
    similar: ["twenty-five-twenty-one", "love-next-door", "itaewon-class"],
    icon: "movie-camera",
    editorialScore: 86, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81486372",
      "https://en.wikipedia.org/wiki/Our_Beloved_Summer",
      "https://english.visitkorea.or.kr/enu/ATR/SI_EN_3_9.jsp?cid=2819883",
    ],
  },
  {
    slug: "reply-1988",
    year: 2015, episodes: 20, network: "tvN",
    genres: ["family", "comedy", "youth", "romance"],
    wikidataId: "Q19657395",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/80188351" }],
    cast: [
      { name: "Lee Hye-ri", entityId: "Q11073341", role: "Sung Deok-sun" },
      { name: "Park Bo-gum", entityId: "Q15977222", role: "Choi Taek" },
      { name: "Ryu Jun-yeol", entityId: "Q20063575", role: "Kim Jung-hwan" },
      { name: "Go Kyung-pyo", entityId: "Q2908769", role: "Sung Sun-woo" },
      { name: "Lee Dong-hwi", entityId: "Q18013648", role: "Ryu Dong-ryong" },
    ],
    // 여행 목록 밖: 태극당(15화 데이트, 중구)·브라운핸즈 도곡점(정봉·미옥 첫 키스, 강남)(VS 'Finding the Traces of Reply 1988')
    filmingPlaces: [],
    similar: ["twenty-five-twenty-one", "when-life-gives-you-tangerines", "love-next-door"],
    icon: "videocassette",
    editorialScore: 91, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/80188351",
      "https://en.wikipedia.org/wiki/Reply_1988",
      "https://english.visitseoul.net/hallyu/Finding-the-Traces-of-Reply-1988_/35497",
    ],
  },
  {
    slug: "start-up",
    year: 2020, episodes: 16, network: "tvN",
    genres: ["romance", "youth"],
    wikidataId: "Q79997521",
    watch: [{ platform: "netflix", url: "https://www.netflix.com/title/81290293" }],
    cast: [
      { name: "Bae Suzy", entityId: "Q464645", role: "Seo Dal-mi" },
      { name: "Nam Joo-hyuk", entityId: "Q17500112", role: "Nam Do-san" },
      { name: "Kim Seon-ho", entityId: "Q37565564", role: "Han Ji-pyeong" },
      { name: "Kang Han-na", entityId: "Q16080045", role: "Won In-jae" },
    ],
    // 여행 목록 밖: 문화비축기지(샌드박스 건물, 상암)·합정돈(합정)·노들섬(VS 'Seoul as Seen in the Romantic TV Series Start-Up!')
    filmingPlaces: [],
    similar: ["itaewon-class", "twenty-five-twenty-one", "can-this-love-be-translated"],
    icon: "laptop",
    editorialScore: 81, addedAt: "2026-10-19",
    sources: [
      "https://www.netflix.com/title/81290293",
      "https://en.wikipedia.org/wiki/Start-Up_(South_Korean_TV_series)",
      "https://english.visitseoul.net/hallyu/Seoul-as-Seen-in-the-Romantic-TV-Series-Start-Up/ENN036494",
    ],
  },
];
