#!/usr/bin/env python3
import argparse
import json
import sys
from datetime import datetime
from urllib.request import urlopen
import xml.etree.ElementTree as ET


def text(el):
    return el.text.strip() if el is not None and el.text else None


def fetch_and_filter(url: str, author: str):
    with urlopen(url) as resp:
        data = resp.read()
    root = ET.fromstring(data)
    channel = root.find('channel')
    items = channel.findall('item') if channel is not None else []

    posts = []
    for item in items:
        creator = item.find('{http://purl.org/dc/elements/1.1/}creator')
        creator_val = text(creator)
        if creator_val and creator_val.strip().lower() == author.lower():
            title = text(item.find('title'))
            link = text(item.find('link'))
            pubDate = text(item.find('pubDate'))
            description = text(item.find('description'))
            categories = [text(c) for c in item.findall('category') if text(c)]
            isoDate = pubDate
            try:
                isoDate = datetime.strptime(pubDate, '%a, %d %b %Y %H:%M:%S %z').isoformat()
            except Exception:
                pass
            posts.append({
                'source': 'all-things-azure',
                'title': title,
                'url': link,
                'date': isoDate,
                'author': creator_val,
                'categories': categories,
                'description': description,
            })
    return posts


def main():
    parser = argparse.ArgumentParser(description='Fetch RSS posts and filter by author')
    parser.add_argument('--url', default='https://devblogs.microsoft.com/all-things-azure/feed/', help='RSS feed URL')
    parser.add_argument('--author', default='jkordick', help='Author login to filter (case-insensitive)')
    parser.add_argument('--out', default='src/data/blog-posts.json', help='Output JSON path')
    args = parser.parse_args()

    posts = fetch_and_filter(args.url, args.author)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    print(f'Wrote {len(posts)} posts to {args.out}')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)
