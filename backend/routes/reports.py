from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone, timedelta
from database import sensor_readings_collection, irrigation_logs_collection, water_analytics_collection
from auth import get_current_user_id

router = APIRouter(tags=["reports"])


@router.get("/reports/historical")
async def get_historical_report(
    user_id: str = Depends(get_current_user_id),
    days: int = Query(default=30, ge=1, le=365),
    metric: str = Query(default="all"),
):
    """Get historical sensor data report for the specified time range"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    query = {"user_id": {"$in": [user_id, "default_user"]}, "timestamp": {"$gte": cutoff}}
    readings = await sensor_readings_collection.find(query, {"_id": 0}).sort("timestamp", 1).to_list(5000)

    if not readings:
        return {"readings": [], "summary": {}, "days": days, "metric": metric}

    sm_vals = [r.get("soil_moisture") for r in readings if r.get("soil_moisture") is not None and 0 <= r.get("soil_moisture", -1) <= 100]
    temp_vals = [r.get("temperature") for r in readings if r.get("temperature") is not None and -50 <= r.get("temperature", -999) <= 70]
    hum_vals = [r.get("humidity") for r in readings if r.get("humidity") is not None and 0 <= r.get("humidity", -1) <= 100]

    summary = {
        "total_readings": len(readings),
        "soil_moisture": {"avg": round(sum(sm_vals) / len(sm_vals), 1) if sm_vals else 0, "min": round(min(sm_vals), 1) if sm_vals else 0, "max": round(max(sm_vals), 1) if sm_vals else 0},
        "temperature": {"avg": round(sum(temp_vals) / len(temp_vals), 1) if temp_vals else 0, "min": round(min(temp_vals), 1) if temp_vals else 0, "max": round(max(temp_vals), 1) if temp_vals else 0},
        "humidity": {"avg": round(sum(hum_vals) / len(hum_vals), 1) if hum_vals else 0, "min": round(min(hum_vals), 1) if hum_vals else 0, "max": round(max(hum_vals), 1) if hum_vals else 0},
    }

    # Aggregate daily for chart
    daily = {}
    for r in readings:
        try:
            day = r["timestamp"][:10]
        except Exception:
            continue
        if day not in daily:
            daily[day] = {"soil_moisture": [], "temperature": [], "humidity": [], "count": 0}
        sm = r.get("soil_moisture")
        temp = r.get("temperature")
        hum = r.get("humidity")
        if sm is not None and 0 <= sm <= 100:
            daily[day]["soil_moisture"].append(sm)
        if temp is not None and -50 <= temp <= 70:
            daily[day]["temperature"].append(temp)
        if hum is not None and 0 <= hum <= 100:
            daily[day]["humidity"].append(hum)
        daily[day]["count"] += 1

    daily_chart = []
    for day, vals in sorted(daily.items()):
        entry = {"date": day, "readings_count": vals["count"]}
        if vals["soil_moisture"]:
            entry["soil_moisture"] = round(sum(vals["soil_moisture"]) / len(vals["soil_moisture"]), 1)
        if vals["temperature"]:
            entry["temperature"] = round(sum(vals["temperature"]) / len(vals["temperature"]), 1)
        if vals["humidity"]:
            entry["humidity"] = round(sum(vals["humidity"]) / len(vals["humidity"]), 1)
        daily_chart.append(entry)

    return {"readings": readings[-200:], "daily_chart": daily_chart, "summary": summary, "days": days, "metric": metric}


@router.get("/reports/irrigation-history")
async def get_irrigation_history(
    user_id: str = Depends(get_current_user_id),
    days: int = Query(default=30, ge=1, le=365),
):
    """Get irrigation history for the specified time range"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    logs = await irrigation_logs_collection.find(
        {"user_id": user_id, "timestamp": {"$gte": cutoff}}, {"_id": 0}
    ).sort("timestamp", -1).to_list(500)

    total_water = sum(log.get("water_quantity", 0) for log in logs)
    critical_count = sum(1 for log in logs if log.get("status") == "critical")

    return {
        "logs": logs,
        "summary": {
            "total_irrigations": len(logs),
            "total_water_used": round(total_water, 2),
            "critical_events": critical_count,
        },
        "days": days,
    }


@router.get("/reports/water-efficiency")
async def get_water_efficiency_report(
    user_id: str = Depends(get_current_user_id),
    days: int = Query(default=30, ge=1, le=365),
):
    """Get water efficiency report for the specified time range"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    analytics = await water_analytics_collection.find(
        {"user_id": user_id, "date": {"$gte": cutoff}}, {"_id": 0}
    ).sort("date", -1).to_list(365)

    if not analytics:
        return {"analytics": [], "summary": {}, "days": days}

    total_used = sum(a.get("water_used", 0) for a in analytics)
    total_saved = sum(a.get("water_saved", 0) for a in analytics)
    avg_eff = sum(a.get("efficiency", 0) for a in analytics) / len(analytics)

    return {
        "analytics": analytics,
        "summary": {
            "total_water_used": round(total_used, 2),
            "total_water_saved": round(total_saved, 2),
            "avg_efficiency": round(avg_eff, 2),
            "savings_percent": round((total_saved / (total_used + total_saved)) * 100, 1) if (total_used + total_saved) > 0 else 0,
        },
        "days": days,
    }
