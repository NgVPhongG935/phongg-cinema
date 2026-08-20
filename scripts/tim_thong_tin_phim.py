"""SearXNG tim link + Scrapling cao du lieu phim — tra JSON stdout cho Spring Boot."""
import json
import os
import re
import sys

BO_QUA_HOST = ("facebook.com", "tiktok.com", "instagram.com", "twitter.com", "x.com")
UUTIEN_HOST = ("imdb.com", "themoviedb.org", "wikipedia.org", "rottentomatoes.com")
YOUTUBE_RE = re.compile(
    r"(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})"
)


def chuan_hoa_text(raw: str, max_len: int = 2500) -> str:
    text = re.sub(r"\s+", " ", raw or "").strip()
    return text[:max_len] if len(text) > max_len else text


def xep_hang_url(url: str) -> int:
    for i, host in enumerate(UUTIEN_HOST):
        if host in url:
            return i
    return 50


def tim_qua_searxng(q: str, base_url: str, so_link: int = 5) -> list:
    import requests

    url = f"{base_url.rstrip('/')}/search"
    phan_hoi = requests.get(url, params={"q": q, "format": "json"}, timeout=20)
    phan_hoi.raise_for_status()
    muc = []
    for ket in phan_hoi.json().get("results", []):
        link = ket.get("url") or ""
        if not link or any(h in link for h in BO_QUA_HOST):
            continue
        snippet = chuan_hoa_text(ket.get("content") or ket.get("title") or "", 400)
        muc.append({"url": link, "snippet": snippet, "rank": xep_hang_url(link)})
    muc.sort(key=lambda x: x["rank"])
    return muc[:so_link]


def tim_youtube_trailer(ten_phim: str, base_url: str) -> str:
    try:
        muc = tim_qua_searxng(f"{ten_phim} official trailer youtube", base_url, 8)
        for item in muc:
            if "youtube.com" in item["url"] or "youtu.be" in item["url"]:
                m = YOUTUBE_RE.search(item["url"])
                if m:
                    return f"https://www.youtube.com/watch?v={m.group(1)}"
        for item in muc:
            noi_dung = lay_html_trang(item["url"])
            link = trich_youtube(noi_dung)
            if link:
                return link
    except Exception:
        pass
    return ""


def lay_html_trang(url: str) -> str:
    try:
        from scrapling.fetchers import Fetcher
        trang = Fetcher.get(url, timeout=25)
        html = trang.html_content
        return html if isinstance(html, str) else str(html)
    except Exception:
        pass
    try:
        import requests
        phan_hoi = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        return phan_hoi.text or ""
    except Exception:
        return ""


def lay_text_trang(url: str) -> str:
    html = lay_html_trang(url)
    if not html:
        return ""
    text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.I | re.S)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    return chuan_hoa_text(text, 3000)


def trich_meta(html: str, prop: str) -> str:
    for pat in (
        rf'property=["\']{prop}["\'][^>]+content=["\']([^"\']+)',
        rf'content=["\']([^"\']+)["\'][^>]+property=["\']{prop}',
        rf'name=["\']{prop}["\'][^>]+content=["\']([^"\']+)',
    ):
        m = re.search(pat, html, re.I)
        if m:
            return m.group(1).strip()
    return ""


def trich_poster(html: str) -> str:
    for key in ("og:image", "twitter:image"):
        url = trich_meta(html, key)
        if url and url.startswith("http"):
            return url
    m = re.search(r'https://[^"\']+media-amazon\.com/images[^"\']+', html)
    if m:
        return m.group(0)
    m = re.search(r'https://[^"\']+\.(?:jpg|jpeg|png|webp)(?:\?[^"\']*)?', html, re.I)
    if m and "logo" not in m.group(0).lower():
        return m.group(0)
    return ""


def trich_youtube(html: str) -> str:
    m = YOUTUBE_RE.search(html or "")
    if m:
        return f"https://www.youtube.com/watch?v={m.group(1)}"
    return ""


def trich_tu_trang(url: str, snippet: str) -> dict:
    html = lay_html_trang(url)
    text = lay_text_trang(url)
    tom_tat = trich_meta(html, "description") or trich_meta(html, "og:description") or snippet
    return {
        "tomTat": chuan_hoa_text(tom_tat, 1200),
        "posterUrl": trich_poster(html),
        "trailerUrl": trich_youtube(html),
        "context": chuan_hoa_text(f"{snippet}\n{text}", 4000),
        "url": url,
    }


def main():
    ten = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
    rong = {
        "tomTat": "",
        "theLoai": "",
        "daoDien": "",
        "dienVien": "",
        "posterUrl": "",
        "trailerUrl": "",
        "context": "",
        "sources": 0,
    }
    if not ten:
        print(json.dumps({**rong, "error": "ten_phim_rong"}))
        return

    base = os.environ.get("SEARXNG_URL", "http://127.0.0.1:8888")
    ket_qua = dict(rong)
    chunks = []
    try:
        trailer = tim_youtube_trailer(ten, base)
        if trailer:
            ket_qua["trailerUrl"] = trailer

        muc_tim = tim_qua_searxng(
            f"{ten} phim plot cast director thể loại genre", base, 6
        )
        for muc in muc_tim[:3]:
            trich = trich_tu_trang(muc["url"], muc["snippet"])
            if trich["context"]:
                chunks.append(f"[{trich['url']}] {trich['context']}")
            if not ket_qua["tomTat"] and trich["tomTat"]:
                ket_qua["tomTat"] = trich["tomTat"]
            if not ket_qua["posterUrl"] and trich["posterUrl"]:
                ket_qua["posterUrl"] = trich["posterUrl"]
            if not ket_qua["trailerUrl"] and trich["trailerUrl"]:
                ket_qua["trailerUrl"] = trich["trailerUrl"]

        ket_qua["context"] = chuan_hoa_text("\n\n".join(chunks), 6000)
        ket_qua["sources"] = len(chunks)
    except Exception as loi:
        ket_qua["error"] = str(loi)[:200]

    print(json.dumps(ket_qua, ensure_ascii=False))


if __name__ == "__main__":
    main()
