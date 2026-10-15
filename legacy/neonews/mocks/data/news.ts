import { NewsCardProps } from "@/components/common/NewsCard";

// NewsCardProps 타입 확장
export interface EnhancedNewsCardProps extends NewsCardProps {
  category: string;
  tags: string[];
  description?: string;
  views: number;
  updatedAt: string;
}

// 메인 뉴스 목업 데이터 (20개)
export const mainNews: EnhancedNewsCardProps[] = [
  {
    id: 1,
    title: "테슬라, 전기차 시장 점유율 확대",
    summary: "테슬라가 글로벌 전기차 시장에서 점유율을 더욱 확대하고 있습니다.",
    content: `
      테슬라가 2024년 1분기 글로벌 전기차 시장에서 놀라운 성과를 기록했습니다.
      
      전년 대비 35% 증가한 시장 점유율을 기록하며, 특히 중국과 유럽 시장에서 큰 성장을 보였습니다.
      신형 모델 Y의 성공적인 출시와 함께, 생산 효율성 향상으로 원가 절감에도 성공했습니다.
      
      테슬라의 기가팩토리는 현재 풀가동 중이며, 주당 1만대 이상의 생산량을 기록하고 있습니다.
      또한, 새로운 자율주행 기능 업데이트로 기술적 우위도 더욱 공고히 하고 있습니다.
      
      일론 머스크 CEO는 "2024년 말까지 완전 자율주행 기술을 상용화할 것"이라고 발표했습니다.
      테슬라는 배터리 기술 혁신을 통해 주행거리도 대폭 개선할 예정입니다.
      
      업계 전문가들은 테슬라의 이러한 성장세가 당분간 계속될 것으로 전망하고 ��습니다.
      전기차 시장의 성장과 함께 테슬라의 지속적인 혁신이 기대됩니다.
      
      한편, 테슬라는 신규 시장 진출도 적극 검토 중인 것으로 알려졌습니다.
    `,
    createdAt: "2024.03.20",
    imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399",
    category: "자동차",
    tags: ["테슬라", "전기차", "모델Y", "EV", "친환경자동차", "머스크"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 2,
    title: "애플, AI 기술 투자 확대",
    summary: "애플이 인공지능 기술 개발에 대규모 투자를 진행합니다.",
    content: `
      애플이 인공지능 분야에 대한 대규모 투자 계획을 발표했습니다.
      
      향후 5년간 100억 달러 규모의 투자를 통해 AI 연구개발을 강화할 예정입니다.
      특히 실리콘밸리 내 새로운 AI 연구센터 설립을 중심으로 투자가 이뤄집니다.
      
      애플  프라이버시를 중시하는 AI 기술 개발에 주력할 것이라고 밝혔습니다.
      온디바이스 AI 처리 기술과 개인정보 보호 강화가 핵심 목표입니다.
      
      iOS와 macOS에 새로운 AI 기능이 대거 탑재될 예정이며,
      시리(Siri)의 대폭적인 성능 개선도 함께 진행됩니다.
      
      업계에서는 애플의 이번 투자가 AI 시장 판도를 바꿀 것으로 전망하고 있습니다.
      구글, 마이크로소프트와의 AI 기술 경쟁이 더욱 치열해질 것으로 예상됩니다.
      
      애플은 연내 첫 AI 제품을 공개할 것으로 알려졌습니다.
    `,
    createdAt: "2024.03.19",
    imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9",
    category: "테크",
    tags: ["애플", "AI", "인공지능", "실리콘밸리", "빅테크", "투자"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 3,
    title: "삼성전자, 새로운 폴더블폰 출시 예정",
    summary: "삼성전자가 혁신적인 폴더블폰 신제품을 공개할 예정입니다.",
    content: `
      삼성전자가 차세대 폴더블 스마트폰의 출시 계획을 발표했습니다.
      
      새로운 폴더블폰은 기존 모델 대비 20% 더 얇아진 두께와 개선된 화면 주름을 자랑합니다.
      히 새로운 힌지 구조를 적용해 내구성을 대폭 강화했습니다.
      
      디스플레이 기술의 혁신으로 더욱 선명한 화질과 높은 휘도를 제공하며,
      배터리 효율성도 크게 개선되었습니다.
      
      카메라 시스템도 완전히 새롭게 디자인되어, 폴더블폰 최고의 카메라 성능을 목표로 합니다.
      AI 기반의 이미지 처리 기술이 탑재되어 더욱 뛰어난 사진 품질을 제공합니다.
      
      삼성전자는 이번 신제품으로 폴더블폰 시장의 선두 위치를 더욱 공고히 할 계획입니다.
      글로벌 출시는 올해 하반기로 예정되어 있습니다.
      
      업계에서는 이번 제품이 폴더블폰의 대중화를 이끌 것으로 기대하고 있습니다.
    `,
    createdAt: "2024.03.18",
    imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c",
    category: "모바일",
    tags: ["삼성전자", "폴더블폰", "갤럭시Z", "스마트폰", "안드로이드"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 4,
    title: "구글, 차세대 검색 엔진 발표",
    summary: "AI 기반의 새로운 검색 알고리즘이 적용됩니다.",
    createdAt: "2024.03.17",
    imageUrl: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd",
    category: "테크",
    tags: ["구글", "차세대", "검색", "엔진", "AI", "알고리즘"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 5,
    title: "마이크로소프트, 게임 산업 투자",
    summary: "클라우드 게이밍 서비스 확대를 위한 대규모 투자를 진행합니다.",
    createdAt: "2024.03.16",
    imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7",
    category: "게임",
    tags: ["마이크로소프트", "게임", "산업", "투자", "클라우드", "게이밍"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 6,
    title: "네이버, 글로벌 AI 기업과 협력",
    summary: "글로벌 기업들과 AI 기술 협력을 강화합니다.",
    createdAt: "2024.03.15",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
    category: "테크",
    tags: ["네이버", "글로벌", "AI", "기업", "협력", "강화"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 7,
    title: "카카오, 모빌리티 사업 확장",
    summary: "자율주행 택시 서비스 시범 운영을 시작합니다.",
    createdAt: "2024.03.14",
    imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537",
    category: "모바일",
    tags: ["카카오", "모빌리티", "사업", "확장", "자율주행", "택시"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 8,
    title: "LG전자, 스마트홈 시장 공략",
    summary: "IoT 기반의 새로운 스마트홈 제품군을 출시합니다.",
    createdAt: "2024.03.13",
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827",
    category: "라이프스타일",
    tags: ["LG전자", "스마트홈", "시장", "공략", "IoT", "제품군"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 9,
    title: "SK하이닉스, 차세대 메모리 개발",
    summary: "새로운 반도체 제조 공정을 도입합니다.",
    createdAt: "2024.03.12",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    category: "테크",
    tags: ["SK하이닉스", "차세대", "메모리", "개발", "반도체", "제조"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 10,
    title: "현대차, 전기차 라인업 확대",
    summary: "2025년까지 전기차 모델을 대폭 확대할 계획입니다.",
    createdAt: "2024.03.11",
    imageUrl: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7",
    category: "자동차",
    tags: ["현대차", "전기차", "라인업", "확대", "계획", "2025년"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 11,
    title: "아마존, 신규 물류센터 설립",
    summary: "아시아 지역 물류 네트워크를 확대합니다.",
    createdAt: "2024.03.10",
    imageUrl: "https://images.unsplash.com/photo-1540544660406-6a69dacb2804",
    category: "금융",
    tags: ["아마존", "신규", "물류센터", "설립", "아시아", "물류"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 12,
    title: "메타, VR 기기 신제품 출시",
    summary: "더욱 진화된 메타버스 경험을 제공합니다.",
    createdAt: "2024.03.09",
    imageUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac",
    category: "엔터테인먼트",
    tags: ["메타", "VR", "기기", "신제품", "출시", "메타버스"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 13,
    title: "넷플릭스, 오리지널 콘텐츠 투자",
    summary: "한국 콘텐츠 제작에 대규모 투자를 진행합니다.",
    createdAt: "2024.03.08",
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85",
    category: "게임",
    tags: ["넷플릭스", "오리지널", "콘텐츠", "투자", "한국", "콘텐츠"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 14,
    title: "인텔, 신규 CPU 아키텍처 공개",
    summary: "전력 효율성이 크게 개선된 새로운 프로세서를 발표합니다.",
    createdAt: "2024.03.07",
    imageUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea",
    category: "테크",
    tags: ["인텔", "신규", "CPU", "아키텍처", "공개", "프로세서"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 15,
    title: "AMD, 그래픽카드 신제품 출시",
    summary: "게이밍 성능을 한 단계 끌어올린 새로운 GPU를 선보입니다.",
    createdAt: "2024.03.06",
    imageUrl: "https://images.unsplash.com/photo-1587202372616-b43abea06c2f",
    category: "테크",
    tags: ["AMD", "그래픽카드", "신제품", "출시", "게이밍", "GPU"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 16,
    title: "삼성전자, 차세대 TV 기술 공개",
    summary: "혁신적인 디스플레이 기술을 선보입니다.",
    content: `
      삼성전자가 CES 2024에서 혁신적인 TV 디스플레이 기술을 공개했습니다.
      마이크로 LED 기술을 적용해 더욱 선명하고 실감나는 화질을 구현했습니다.
      AI 업스케일링 기술로 저해상도 콘텐츠도 8K 수준으로 변환합니다.
      게이밍 모드에서 0.1ms 응답속도와 240Hz 주사율을 지원합니다.
      친환경 소재를 사용하고 전력 소비도 30% 절감되었습니다.
    `,
    createdAt: "2024.03.05",
    imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6",
    category: "테크",
    tags: ["삼성전자", "TV", "기술", "디스플레이", "CES"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 17,
    title: "카카오페이, 금융 서비스 확대",
    summary: "새로운 금융 상품과 서비스를 출시합니다.",
    content: `
      카카오페이가 종합 금융 플랫폼으로의 도약을 선언했습니다.
      신용카드, 대출, 보험 등 새로운 금융 서비스를 순차적으로 출시합니다.
      AI 기반 자산관리 서비스도 새롭게 도입될 예정입니다.
      간편결제를 넘어 종합 금융 서비스로 영역을 확장합니다.
      연내 1000만 명의 금융 서비스 이용자 확보를 목표로 합니다.
    `,
    createdAt: "2024.03.04",
    imageUrl: "https://images.unsplash.com/photo-1580508174046-170816f65662",
    category: "금융",
    tags: ["카카오페이", "금융", "서비스", "확대", "핀테크"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 18,
    title: "네이버클라우드, AI 서비스 출시",
    summary: "기업용 AI 솔루션을 제공합니다.",
    content: `
      네이버클라우드가 기업용 AI 서비스 플랫폼을 출시했습니다.
      자연어 처리, 이미지 인식, 음성 인식 등 다양한 AI 기능을 제공합니다.
      중소기업도 쉽게 도입할 수 있는 합리적인 가격 정책을 제시했습니다.
      클라우드 기반으로 즉시 도입이 가능하며 확장성도 뛰어납니다.
      글로벌 시장 진출도 준비 중이며 해외 파트너십도 확대할 예정입니다.
    `,
    createdAt: "2024.03.03",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
    category: "테크",
    tags: ["네이버클라우드", "AI", "서비스", "기업용", "클라우드"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 19,
    title: "현대모비스, 자율주행 기술 혁신",
    summary: "새로운 자율주행 시스템을 개발했습니다.",
    content: `
      현대모비스가 레벨 4 수준의 자율주행 시스템 개발에 성공했습니다.
      새로운 센서 퓨전 기술로 악천후에서도 안정적인 주행이 가능합니다.
      5G 통신을 활용한 V2X 기술로 차량 간 실시간 정보 공유가 가능합니다.
      2025년부터 양산차에 순차적으로 적용될 예정입니다.
      글로벌 자율주행 시장에서의 경쟁력 강화가 기대됩니다.
    `,
    createdAt: "2024.03.02",
    imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341",
    category: "자동차",
    tags: ["현대모비스", "자율주행", "기술", "혁신", "모빌리티"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 20,
    title: "프로미스나인, 새 앨범 콘셉트 공개",
    summary: "새로운 변신을 예고하는 콘셉트를 공개했습니다.",
    content: `
      프로미스나인이 새 미니앨범의 콘셉트 포토를 공개했습니다.
      이번 앨범은 레트로 팝 장르에 도전하며 새로운 매력을 선보입니다.
      타이틀곡은 유명 프로듀서 팀과의 협업으로 완성되었습니다.
      글로벌 팬들을 겨냥한 월드투어도 준비 중입니다.
      컴백 후 음악방송 8관왕을 목표로 하고 있습니다.
    `,
    createdAt: "2024.03.01",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    category: "K-POP",
    tags: ["프로미스나인", "새", "앨범", "콘셉트", "공개", "K-POP"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
];

// K-POP 뉴스 목업 데이터 (20개)
export const kpopNews: EnhancedNewsCardProps[] = [
  {
    id: 1,
    title: "르세라핌, 신곡 'EASY' 글로벌 차트 석권",
    summary: "르세라핌의 새 싱글이 아이튠즈 차트 정상에 올랐습니다.",
    createdAt: "2024.03.20",
    imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1",
    category: "K-POP",
    tags: ["르세라핌", "EASY", "걸그룹", "하이브", "컴백", "글로벌"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 2,
    title: "방탄소년단 정국, 솔로 활동 신기록",
    summary: "스포티파이 스트리밍 기록을 갱신했습니다.",
    createdAt: "2024.03.19",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
    category: "K-POP",
    tags: ["방탄소년단", "정국", "솔로", "스포티파이", "BTS", "빌보드"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 3,
    title: "블랙핑크, 월드투어 성공적 마무리",
    summary: "전 세계 팬들과 함께한 대규모 투어를 마쳤습니다.",
    createdAt: "2024.03.18",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
    category: "K-POP",
    tags: ["블랙핑크", "월드투어", "성공적", "마무리", "K-POP", "대규모"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 4,
    title: "뉴진스, 신곡 티저 공개",
    summary: "컴백을 앞두고 신곡 티저를 공개했습니다.",
    createdAt: "2024.03.17",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    category: "K-POP",
    tags: ["뉴진스", "신곡", "티저", "공개", "컴백", "K-POP"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 5,
    title: "아이브, 일본 데뷔 성공",
    summary: "일본 오리콘 차트 1위를 기록했습니다.",
    createdAt: "2024.03.16",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    category: "K-POP",
    tags: ["아이브", "일본", "데뷔", "성공", "오리콘", "차트"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 6,
    title: "엔하이픈, 미국 투어 시작",
    summary: "북미 지역 첫 단독 투어를 시작합니다.",
    content: `
      엔하이픈이 미국 15개 도시를 도는 첫 단독 투어를 시작했습니다.
      LA 공연을 시작으로 뉴욕, 시카고 등 주요 도시를 순회합니다.
      현지 팬들의 뜨거운 호응으로 일부 도시는 추가 공연을 확정했습니다.
      미국 메이저 방송사들도 높은 관심을 보이며 인터뷰를 요청하고 있습니다.
    `,
    createdAt: "2024.03.15",
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
    category: "K-POP",
    tags: ["엔하이픈", "미국", "투어", "시작", "북미", "첫"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 7,
    title: "에스파, 새 앨범 발매 예고",
    summary: "세 번째 정규 앨범 발매를 앞두고 있습니다.",
    content: `
      에스파가 새 정규앨범의 콘셉트 포토를 순차적으로 공개하고 있습니다.
      이번 앨범은 메타버스 세계관을 더욱 확장한 스토리를 담고 있습니다.
      타이틀곡은 세계적인 프로듀서와의 협업으로 완성되었습니다.
      글로벌 프로모션을 위해 미국 활동도 준비 중입니다.
    `,
    createdAt: "2024.03.14",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    category: "K-POP",
    tags: ["에스파", "새", "앨범", "발매", "예고", "K-POP"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 8,
    title: "스트레이 키즈, 유럽 투어 성황",
    summary: "유럽 전역에서 뜨거운 호응을 얻고 있습니다.",
    content: `
      스트레이 키즈의 유럽 투어가 전석 매진을 기록하며 성황리에 진행 중입니다.
      런던, 파리, 베를린 등 주요 도시에서 현지 팬들의 열광적인 반응을 얻었습니다.
      유럽 음악 시장에서의 영향력을 입증하며 K-POP의 위상을 높였습니다.
      현지 음악 차트에서도 좋은 성적을 거두며 글로벌 인기를 증명했습니다.
    `,
    createdAt: "2024.03.13",
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
    category: "K-POP",
    tags: ["스트레이", "키즈", "유럽", "투어", "성황", "K-POP"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 9,
    title: "투모로우바이투게더, 신기록 달성",
    summary: "앨범 판매량 신기록을 세웠습니다.",
    content: `
      투모로우바이투게더의 새 앨범이 초동 판매량 200만장을 돌파했습니다.
      데뷔 이후 최고 기록을 경신하며 4세대 보이그룹의 강세를 입증했습니다.
      타이틀곡은 멜론, 지니 등 국내 음원 차트 1위를 석권했습니다.
      해외 차트에서도 좋은 성적을 거두며 글로벌 영향력을 보여주었습니다.
    `,
    createdAt: "2024.03.12",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    category: "K-POP",
    tags: ["투모로우바이투게더", "신기록", "달성", "앨범", "판매량", "K-POP"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
  {
    id: 10,
    title: "있지, 새 콘셉트 티저 공개",
    summary: "새로운 변��을 예고했습니다.",
    content: `
      있지가 컴백을 앞두고 파격적인 콘셉트 변화를 예고했습니다.
      록 장르에 도전하는 새로운 음악 스타일로 팬들의 기대를 모으고 있습니다.
      멤버들의 개성 있는 보컬과 퍼포먼스가 돋보이는 앨범이 될 전망입니다.
      글로벌 프로모션을 위한 대규모 마케팅도 준비 중입니다.
    `,
    createdAt: "2024.03.11",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
    category: "K-POP",
    tags: ["있지", "새", "콘셉트", "티저", "공개", "K-POP"],
    views: 0,
    updatedAt: "2024-03-21T00:00:00Z",
  },
];

// 메인 슬라이더 목업 데이터
export interface SlideItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
}

export const mainSlides: SlideItem[] = [
  {
    id: 1,
    title: "2024년 투자 트렌드",
    description: "올해 주목해야 할 글로벌 투자 트렌드를 소개합니다",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f",
    category: "금융",
    tags: ["투자", "주식", "글로벌마켓", "트렌드", "2024년전망"],
  },
  {
    id: 2,
    title: "AI 투자의 시대",
    description: "인공지능이 바꾸는 투자의 미래",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
    category: "테크",
    tags: ["AI", "인공지능", "투자", "핀테크", "로보어드바이저"],
  },
  {
    id: 3,
    title: "글로벌 경제 전망",
    description: "2024년 세계 경제는 어디로 향하나",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
    category: "경제",
    tags: ["경제전망", "글로벌경제", "2024년", "시장분석"],
  },
];

// 카테고리 목록
export const categories = [
  "테크",
  "모바일",
  "자동차",
  "금융",
  "경제",
  "K-POP",
  "엔터테인먼트",
  "게임",
  "라이프스타일",
] as const;

export const slides: SlideItem[] = [
  {
    id: 1,
    title: "에스파, AI 아바타와 함께하는 신곡 공개",
    description: "메타버스 세계관 확장한 'Drama' 발매",
    imageUrl: "https://cdn.kagit.kr/news/slides/aespa_drama.webp",
    category: "K-POP",
    tags: ["에스파", "Drama", "메타버스", "AI", "컴백"],
  },
  {
    id: 2,
    title: "삼성전자, 차세대 AI 반도체 발표",
    description: "모바일 AI 시대 선도할 새로운 프로세서 공개",
    imageUrl: "https://cdn.kagit.kr/news/slides/samsung_ai.webp",
    category: "테크",
    tags: ["삼성전자", "AI", "반도체", "기술혁신"],
  },
  {
    id: 3,
    title: "뉴진스, 글로벌 차트 석권",
    description: "신곡 'Super Shy' 빌보드 핫100 진입",
    imageUrl: "https://cdn.kagit.kr/news/slides/newjeans.webp",
    category: "K-POP",
    tags: ["뉴진스", "글로벌", "빌보드", "K-POP"],
  },
  {
    id: 4,
    title: "에스파 카리나, AI 브랜드 앰버서더 발탁",
    description: "글로벌 AI 기업과 독점 계약 체결",
    imageUrl: "https://cdn.kagit.kr/news/slides/karina_ai.webp",
    category: "K-POP",
    tags: ["에스파", "카리나", "AI", "브랜드"],
  },
  {
    id: 5,
    title: "네이버, 초거대 AI 모델 공개",
    description: "K-POP 콘텐츠 생성 특화 AI 기술 선보여",
    imageUrl: "https://cdn.kagit.kr/news/slides/naver_ai.webp",
    category: "테크",
    tags: ["네이버", "AI", "K-POP", "기술"],
  },
  {
    id: 6,
    title: "에스파 윈터, AI 아트 전시회 개최",
    description: "AI가 그린 초상화로 새로운 예술 시도",
    imageUrl: "https://cdn.kagit.kr/news/slides/winter_ai.webp",
    category: "K-POP",
    tags: ["에스파", "윈터", "AI", "아트", "전시회"],
  },
  {
    id: 7,
    title: "카카오브레인, K-POP AI 작곡가 개발",
    description: "AI가 만든 첫 K-POP 곡 화제",
    imageUrl: "https://cdn.kagit.kr/news/slides/kakao_ai.webp",
    category: "테크",
    tags: ["카카오", "AI", "K-POP", "작곡", "기술"],
  },
];
