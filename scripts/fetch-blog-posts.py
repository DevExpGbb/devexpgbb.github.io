#!/usr/bin/env python3
"""
Fetch blog posts from multiple RSS feeds defined in a YAML config file.
Supports filtering by author(s) per blog, or fetching all posts if no authors specified.
"""
import argparse
import json
import sys
from datetime import datetime
from urllib.request import urlopen
import xml.etree.ElementTree as ET

try:
    import yaml
except ImportError:
    yaml = None


def text(el):
    return el.text.strip() if el is not None and el.text else None


def fetch_posts(url: str, source_id: str, authors: list[str] | None = None):
    """Fetch RSS feed and optionally filter by author(s)."""
    with urlopen(url) as resp:
        data = resp.read()
    root = ET.fromstring(data)
    channel = root.find('channel')
    items = channel.findall('item') if channel is not None else []

    posts = []
    for item in items:
        creator = item.find('{http://purl.org/dc/elements/1.1/}creator')
        creator_val = text(creator)
        
        # Filter by author if specified
        if authors:
            if not creator_val or creator_val.strip().lower() not in [a.lower() for a in authors]:
                continue

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
            'source': source_id,
            'title': title,
            'url': link,
            'date': isoDate,
            'author': creator_val,
            'categories': categories,
            'description': description,
        })
    return posts


def load_config(config_path: str) -> list[dict]:
    """Load blog configuration from YAML file."""
    if yaml is None:
        raise ImportError("PyYAML is required. Install with: pip install pyyaml")
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    return config.get('blogs', [])


def main():
    parser = argparse.ArgumentParser(description='Fetch RSS posts from configured blogs')
    parser.add_argument('--config', default='src/data/blogs.yaml', help='Path to blogs YAML config')
    parser.add_argument('--out', default='src/data/blog-posts.json', help='Output JSON path')
    # Legacy single-blog mode
    parser.add_argument('--url', help='(Legacy) Single RSS feed URL')
    parser.add_argument('--author', help='(Legacy) Single author to filter')
    args = parser.parse_args()

    all_posts = []

    # Legacy mode: single URL/author
    if args.url:
        authors = [args.author] if args.author else None
        source_id = 'custom'
        posts = fetch_posts(args.url, source_id, authors)
        all_posts.extend(posts)
        print(f'  {source_id}: {len(posts)} posts')
    else:
        # Config mode: read from YAML
        blogs = load_config(args.config)
        for blog in blogs:
            blog_id = blog.get('id', 'unknown')
            url = blog.get('url')
            authors = blog.get('authors')  # None if not specified
            if not url:
                print(f'  ⚠️  Skipping {blog_id}: no URL', file=sys.stderr)
                continue
            try:
                posts = fetch_posts(url, blog_id, authors)
                # Apply limit if specified
                limit = blog.get('limit')
                if limit and isinstance(limit, int) and limit > 0:
                    posts = posts[:limit]
                all_posts.extend(posts)
                print(f'  {blog_id}: {len(posts)} posts')
            except Exception as e:
                print(f'  ⚠️  Error fetching {blog_id}: {e}', file=sys.stderr)

    # Sort by date descending
    all_posts.sort(key=lambda p: p.get('date') or '', reverse=True)

    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(all_posts, f, ensure_ascii=False, indent=2)

    print(f'✅ Wrote {len(all_posts)} total posts to {args.out}')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)
