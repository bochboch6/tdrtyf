"""
Campaign Hit Checker — Google Trends analysis
Usage:
    python SearchedArtical.py --keyword "Délice" --event-time "2024-03-15 20:00" --geo TN
Output:
    JSON to stdout only
"""
import argparse
import json
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List

try:
    from pytrends.request import TrendReq
except ImportError:
    print(json.dumps({
        "hit_detected": "Unclear",
        "strength": "Low",
        "evidence": ["pytrends not installed. Run: pip install pytrends requests \"urllib3<2\""],
        "sources": []
    }))
    sys.exit(0)


@dataclass
class Source:
    name: str
    granularity: str
    growth_pct: float
    spike_ratio: float
    trend_direction: str
    before_avg: float
    after_avg: float
    sample_size: int


@dataclass
class Report:
    hit_detected: str
    strength: str
    evidence: List[str]
    sources: List[Source] = field(default_factory=list)


def analyze(keyword: str, event_time_str: str, geo: str = "TN") -> Report:
    try:
        event_dt = datetime.strptime(event_time_str, "%Y-%m-%d %H:%M")
    except ValueError:
        event_dt = datetime.strptime(event_time_str, "%Y-%m-%d")

    event_date = event_dt.date()
    start_date = event_date - timedelta(days=7)
    end_date   = event_date + timedelta(days=7)
    timeframe  = f"{start_date} {end_date}"

    try:
        pytrends = TrendReq(hl="fr-TN", tz=60, timeout=(10, 25), retries=2, backoff_factor=0.5)
        pytrends.build_payload([keyword], cat=0, timeframe=timeframe, geo=geo)
        df = pytrends.interest_over_time()
    except Exception as e:
        return Report(
            hit_detected="Unclear",
            strength="Low",
            evidence=[f"Google Trends request failed: {str(e)[:120]}"],
            sources=[],
        )

    if df is None or df.empty:
        return Report(
            hit_detected="Unclear",
            strength="Low",
            evidence=["No Google Trends data found for this keyword in the selected region."],
            sources=[],
        )

    df = df.drop(columns=["isPartial"], errors="ignore")

    before = df[df.index.date <  event_date][keyword]
    after  = df[df.index.date >= event_date][keyword]

    before_avg  = float(before.mean()) if not before.empty else 0.0
    after_avg   = float(after.mean())  if not after.empty  else 0.0
    peak_after  = float(after.max())   if not after.empty  else 0.0
    sample_size = int(len(after))

    growth_pct  = ((after_avg - before_avg) / (before_avg + 1)) * 100
    spike_ratio = after_avg / (before_avg + 1)

    # Hit detection
    if spike_ratio >= 2.0 or growth_pct >= 60:
        hit_detected = "Yes"
        strength     = "High"
    elif spike_ratio >= 1.3 or growth_pct >= 25:
        hit_detected = "Yes"
        strength     = "Medium"
    elif spike_ratio >= 0.85:
        hit_detected = "Unclear"
        strength     = "Low"
    else:
        hit_detected = "No"
        strength     = "Low"

    # Trend direction
    if len(after) >= 2:
        first_half  = float(after.iloc[:len(after) // 2].mean())
        second_half = float(after.iloc[len(after) // 2:].mean())
        if second_half > first_half * 1.1:
            trend_direction = "rising"
        elif second_half < first_half * 0.9:
            trend_direction = "declining"
        else:
            trend_direction = "stable"
    else:
        trend_direction = "stable"

    # Evidence
    evidence = [
        f"Avg search volume before campaign: {before_avg:.1f} → after: {after_avg:.1f}",
        f"Peak search index after airing: {peak_after:.0f}/100",
        f"Search interest {'grew' if growth_pct > 0 else 'changed'} by {growth_pct:+.1f}% following the air time.",
    ]
    if hit_detected == "Yes":
        evidence.append("Significant spike detected — campaign likely drove audience searches.")
    elif hit_detected == "No":
        evidence.append("No measurable spike — campaign did not drive notable search activity.")
    else:
        evidence.append("Marginal movement — impact is inconclusive from search data alone.")

    source = Source(
        name="Google Trends",
        granularity="daily",
        growth_pct=round(growth_pct, 1),
        spike_ratio=round(spike_ratio, 2),
        trend_direction=trend_direction,
        before_avg=round(before_avg, 1),
        after_avg=round(after_avg, 1),
        sample_size=sample_size,
    )

    return Report(
        hit_detected=hit_detected,
        strength=strength,
        evidence=evidence,
        sources=[source],
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--keyword",    required=True)
    parser.add_argument("--event-time", required=True)
    parser.add_argument("--geo",        default="TN")
    args = parser.parse_args()

    report = analyze(args.keyword, args.event_time, args.geo)

    result = {
        "hit_detected": report.hit_detected,
        "strength": report.strength,
        "evidence": report.evidence,
        "sources": [
            {
                "name": s.name,
                "granularity": s.granularity,
                "growth_pct": s.growth_pct if s.growth_pct != float("inf") else 9999,
                "spike_ratio": s.spike_ratio if s.spike_ratio != float("inf") else 9999,
                "trend_direction": s.trend_direction,
                "before_avg": s.before_avg,
                "after_avg": s.after_avg,
                "sample_size": s.sample_size,
            }
            for s in report.sources
        ],
    }

    sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
    sys.stdout.buffer.write(b"\n")
    sys.stdout.buffer.flush()


if __name__ == "__main__":
    main()
