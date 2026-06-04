import json
import os

def parse_file(filepath, label):
    if not os.path.exists(filepath):
        print(f"\n{label} file '{filepath}' not found.")
        return
        
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            d = json.load(f)
    except Exception:
        with open(filepath, "r", encoding="utf-16") as f:
            d = json.load(f)

    score = d['categories']['performance']['score'] * 100
    print(f"\n==================================================")
    print(f" {label} LIGHTHOUSE PERFORMANCE SCORE: {score:.1f}/100")
    print(f"==================================================")

    print("\nKey Metrics:")
    metrics = [
        'first-contentful-paint',
        'largest-contentful-paint',
        'total-blocking-time',
        'cumulative-layout-shift',
        'speed-index',
        'interactive'
    ]
    for m in metrics:
        audit = d['audits'].get(m, {})
        title = audit.get('title', m)
        value = audit.get('displayValue', 'N/A')
        s = audit.get('score', 0)
        print(f" - {title}: {value} (Score: {s})")

    print("\nLow-Scoring Audits (< 0.90):")
    failed_audits = []
    for audit_id, audit in d['audits'].items():
        s = audit.get('score')
        if s is not None and s < 0.90:
            title = audit.get('title', audit_id)
            value = audit.get('displayValue', '')
            failed_audits.append((title, value, s, audit_id))

    # Sort failed audits by score (lowest first)
    failed_audits.sort(key=lambda x: x[2])
    for title, value, s, audit_id in failed_audits[:15]: # Show top 15
        val_str = f" [{value}]" if value else ""
        print(f" - {title}{val_str} (Score: {s:.2f} | ID: {audit_id})")

parse_file("lighthouse-mobile.json", "MOBILE")
parse_file("lighthouse-desktop.json", "DESKTOP")
