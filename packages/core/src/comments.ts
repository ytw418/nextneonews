import type { Locale } from "./locales";

// 댓글에서 서버와 브라우저가 같이 쓰는 것. node:crypto 를 쓰지 않아 클라이언트에서도 불러올 수 있다

// 광고 도배는 거의 다 링크라 링크가 든 댓글은 받지 않는다 (입력창도 같은 규칙으로 미리 알려 준다)
export const LINK = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|kr|jp|cn|ru|xyz|top|link|shop)\b/i;

interface FriendlyNames {
  adjectives: readonly string[];
  animals: readonly string[];
  format: (adjective: string, animal: string) => string;
}

const joined = (adjective: string, animal: string) => `${adjective}${animal}`;
const spaced = (adjective: string, animal: string) => `${adjective} ${animal}`;
const nounFirst = (adjective: string, animal: string) => `${animal} ${adjective}`;

// 닉네임 칸 대신 "다정한수달"처럼 귀여운 이름을 하나 골라 준다. 형용사 12 × 동물 12.
// ja·ko·zh 는 붙여 쓰고, id·vi·fr 은 명사가 앞, fr 은 남녀 같은 꼴 형용사, ru 는 남성 명사·형용사만 쓴다.
// 서버 닉네임 최대 길이(20자)를 넘는 조합이 없어야 한다 (nickname.test.ts)
export const FRIENDLY: Record<Locale, FriendlyNames> = {
  ko: {
    adjectives: ["다정한", "씩씩한", "졸린", "신난", "수줍은", "용감한", "느긋한", "반짝이는", "명랑한", "포근한", "상냥한", "엉뚱한"],
    animals: ["수달", "고양이", "강아지", "토끼", "판다", "햄스터", "다람쥐", "펭귄", "여우", "코알라", "부엉이", "고슴도치"],
    format: joined,
  },
  ja: {
    adjectives: ["元気な", "陽気な", "静かな", "素直な", "優しい", "眠たい", "明るい", "小さな", "ふわふわの", "きらきらの", "気まぐれな", "まじめな"],
    animals: ["ウサギ", "ネコ", "イヌ", "パンダ", "ペンギン", "キツネ", "リス", "ハムスター", "コアラ", "フクロウ", "ラッコ", "ハリネズミ"],
    format: joined,
  },
  "zh-TW": {
    adjectives: ["快樂的", "害羞的", "勇敢的", "溫柔的", "愛睏的", "開心的", "安靜的", "調皮的", "認真的", "悠閒的", "閃亮的", "活潑的"],
    animals: ["貓咪", "小狗", "兔子", "熊貓", "企鵝", "狐狸", "松鼠", "倉鼠", "無尾熊", "貓頭鷹", "水獺", "刺蝟"],
    format: joined,
  },
  "zh-CN": {
    adjectives: ["快乐的", "害羞的", "勇敢的", "温柔的", "犯困的", "开心的", "安静的", "调皮的", "认真的", "悠闲的", "闪亮的", "活泼的"],
    animals: ["猫咪", "小狗", "兔子", "熊猫", "企鹅", "狐狸", "松鼠", "仓鼠", "考拉", "猫头鹰", "水獭", "刺猬"],
    format: joined,
  },
  en: {
    adjectives: ["Happy", "Sleepy", "Brave", "Gentle", "Cheerful", "Shy", "Sunny", "Cozy", "Lucky", "Bright", "Curious", "Chill"],
    animals: ["Otter", "Bunny", "Panda", "Fox", "Penguin", "Koala", "Hamster", "Squirrel", "Kitten", "Puppy", "Owl", "Hedgehog"],
    format: spaced,
  },
  vi: {
    adjectives: ["vui vẻ", "hiền lành", "dũng cảm", "ngái ngủ", "nhút nhát", "lém lỉnh", "chăm chỉ", "thong thả", "lấp lánh", "hồn nhiên", "đáng yêu", "tươi tắn"],
    animals: ["Mèo", "Cún", "Thỏ", "Gấu trúc", "Cáo", "Sóc", "Gấu túi", "Cú mèo", "Rái cá", "Nhím", "Vịt", "Hải cẩu"],
    format: nounFirst,
  },
  id: {
    adjectives: ["Ceria", "Ngantuk", "Berani", "Lembut", "Pemalu", "Santai", "Riang", "Manis", "Imut", "Lucu", "Tenang", "Rajin"],
    animals: ["Kucing", "Kelinci", "Panda", "Rubah", "Penguin", "Koala", "Hamster", "Tupai", "Bebek", "Burung Hantu", "Landak", "Anjing"],
    format: nounFirst,
  },
  fr: {
    adjectives: ["calme", "sage", "timide", "drôle", "tranquille", "aimable", "agile", "brave", "fidèle", "espiègle", "paisible", "sympa"],
    animals: ["Loutre", "Panda", "Renard", "Lapin", "Pingouin", "Koala", "Hamster", "Écureuil", "Chaton", "Chiot", "Hibou", "Hérisson"],
    format: nounFirst,
  },
  ru: {
    adjectives: ["Весёлый", "Сонный", "Смелый", "Добрый", "Тихий", "Милый", "Ласковый", "Шустрый", "Скромный", "Мудрый", "Солнечный", "Задорный"],
    animals: ["енот", "кот", "лис", "зайчик", "пингвин", "хомяк", "бурундук", "ёжик", "котёнок", "щенок", "филин", "тюлень"],
    format: spaced,
  },
};

const SIZE = 12;

function pick(locale: Locale, adjective: number, animal: number): string {
  const names = FRIENDLY[locale];
  return names.format(names.adjectives[adjective % SIZE]!, names.animals[animal % SIZE]!);
}

// 글쓴이가 쓰는 이름 (처음 한 번, 그리고 섞기 버튼)
export function randomFriendlyName(locale: Locale, rand: () => number = Math.random): string {
  return pick(locale, Math.floor(rand() * SIZE), Math.floor(rand() * SIZE));
}

// 이름 없이 올라온 댓글: 같은 해시면 늘 같은 이름
export function friendlyNameFromHash(locale: Locale, hex: string): string {
  const n = parseInt(hex, 16) || 0;
  return pick(locale, n % SIZE, Math.floor(n / SIZE) % SIZE);
}
