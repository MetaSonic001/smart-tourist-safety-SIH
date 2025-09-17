import math
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import Alert
from app.config import settings

class ClusteringService:
    
    @staticmethod
    def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    async def should_create_incident(self, db: AsyncSession, alert: Alert) -> Tuple[bool, List[str]]:
        """Check if alert should trigger incident creation based on clustering"""
        if not alert.lat or not alert.lng:
            return False, []
        
        # Get time window
        time_threshold = datetime.utcnow() - timedelta(hours=settings.incident_cluster_time_window_hours)
        
        # Find nearby alerts in time window
        query = select(Alert).where(
            Alert.created_at >= time_threshold,
            Alert.incident_id.is_(None),  # Not already part of an incident
            Alert.lat.isnot(None),
            Alert.lng.isnot(None)
        )
        
        result = await db.execute(query)
        nearby_alerts = []
        
        for existing_alert in result.scalars():
            if existing_alert.alert_id == alert.alert_id:
                continue
                
            distance = self.calculate_distance(
                alert.lat, alert.lng,
                existing_alert.lat, existing_alert.lng
            )
            
            if distance <= settings.incident_cluster_radius_km:
                nearby_alerts.append(existing_alert.alert_id)
        
        # Include current alert in count
        total_alerts = len(nearby_alerts) + 1
        
        should_create = total_alerts >= settings.incident_cluster_threshold
        if should_create:
            nearby_alerts.append(alert.alert_id)
        
        return should_create, nearby_alerts

clustering_service = ClusteringService()
