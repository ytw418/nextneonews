import urllib.request, urllib.robotparser, sys
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36'
targets = [
 ("news.google.com", "/rss/search?q=x"), ("trends.google.com", "/trending/rss?geo=KR"),
 ("www.yna.co.kr", "/rss/entertainment.xml"), ("theqoo.net", "/hot"), ("www.instiz.net", "/pt"),
 ("global.oliveyoung.com", "/display/page/best-seller"), ("www.oliveyoung.co.kr", "/store/main/getBestList.do"),
 ("cu.bgfretail.com", "/product/product.do"), ("gs25.gsretail.com", "/gscvs/ko/products/event-goods"),
 ("www.k-eta.go.kr", "/portal/board/viewboardlist.do"), ("www.hikorea.go.kr", "/board/BoardNtcListR.pt"),
 ("www.studyinkorea.go.kr", "/ko/main.do"), ("chiebukuro.yahoo.co.jp", "/category/2078297841/question/list"),
 ("www.teamblind.com", "/kr/topics/x"), ("www.ptt.cc", "/bbs/Korea_Travel/index.html"),
 ("m.entertain.naver.com", "/ranking"), ("pann.nate.com", "/talk/ranking"), ("search.naver.com", "/search.naver"),
]
for host, p in targets:
    url=f"https://{host}/robots.txt"
    try:
        req=urllib.request.Request(url, headers={"User-Agent": UA})
        body=urllib.request.urlopen(req, timeout=15).read().decode("utf-8","ignore")
        rp=urllib.robotparser.RobotFileParser(); rp.parse(body.splitlines())
        verdict = "허용" if rp.can_fetch("*", f"https://{host}{p}") else "금지"
        print(f"{host:28} {p:45} {verdict}")
    except urllib.error.HTTPError as e:
        print(f"{host:28} {p:45} robots.txt {e.code} ({'없음=허용' if e.code==404 else '확인불가'})")
    except Exception as e:
        print(f"{host:28} {p:45} 오류 {type(e).__name__}")
