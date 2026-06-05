import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

log_path = r"C:\Users\abhir\.gemini\antigravity\brain\c2933f83-0a12-4cf0-b612-96ee6ee53d0e\.system_generated\logs\transcript.jsonl"
if not os.path.exists(log_path):
    print("Transcript not found")
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        content = obj.get('content', '')
        if not content:
            continue
        if obj.get('source') == 'MODEL' and ("14." in content or "15." in content or "16." in content):
            # Let's print matching lines from this step
            lines = content.split('\n')
            numbered = [l.strip() for l in lines if any(l.strip().startswith(f"{n}.") for n in range(1, 30))]
            if len(numbered) > 10:
                print(f"Step {obj.get('step_index')} (source: MODEL) has {len(numbered)} numbered list items:")
                for n_item in numbered:
                    print(f"  {n_item}")
                print("-" * 50)
