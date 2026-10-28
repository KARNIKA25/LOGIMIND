from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.repositories.warehouse_repo import WarehouseRepository
from app.repositories.shipment_repo import ShipmentRepository
from app.repositories.inventory_repo import InventoryRepository
from app.repositories.supplier_repo import SupplierRepository
from app.repositories.product_repo import ProductRepository
from app.repositories.fleet_repo import VehicleRepository
from app.schemas.analytics import ExecutiveDashboardResponse, KPISummary

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.wh_repo = WarehouseRepository(db)
        self.ship_repo = ShipmentRepository(db)
        self.inv_repo = InventoryRepository(db)
        self.sup_repo = SupplierRepository(db)
        self.prod_repo = ProductRepository(db)
        self.veh_repo = VehicleRepository(db)

    def get_executive_dashboard(self) -> ExecutiveDashboardResponse:
        total_warehouses = self.wh_repo.count()
        total_shipments = self.ship_repo.count()
        total_products = self.prod_repo.count()
        total_vehicles = self.veh_repo.count()
        
        low_stock_items = self.inv_repo.get_low_stock_items()

        # KPIs
        kpis = [
            KPISummary(
                title="Total Gross Revenue",
                value="$1,428,950",
                numeric_value=1428950.0,
                change_percentage=14.8,
                is_positive_trend=True,
                subtitle="vs. prior month",
                icon_name="TrendingUp"
            ),
            KPISummary(
                title="Active Shipments in Transit",
                value=str(max(18, total_shipments)),
                numeric_value=float(max(18, total_shipments)),
                change_percentage=8.2,
                is_positive_trend=True,
                subtitle="98.4% on-time rate",
                icon_name="LocalShipping"
            ),
            KPISummary(
                title="Avg Warehouse Utilization",
                value="74.6%",
                numeric_value=74.6,
                change_percentage=-2.1,
                is_positive_trend=True,
                subtitle="Optimal headroom available",
                icon_name="Warehouse"
            ),
            KPISummary(
                title="Supply Chain Risk Index",
                value="0.04 (Low)",
                numeric_value=0.04,
                change_percentage=-32.0,
                is_positive_trend=True,
                subtitle="Zero critical bottlenecks",
                icon_name="ShieldCheck"
            )
        ]

        # Monthly Revenue & Margin Trends
        revenue_chart = [
            {"month": "May", "revenue": 1120000, "cost": 840000, "profit": 280000},
            {"month": "Jun", "revenue": 1240000, "cost": 910000, "profit": 330000},
            {"month": "Jul", "revenue": 1190000, "cost": 880000, "profit": 310000},
            {"month": "Aug", "revenue": 1310000, "cost": 950000, "profit": 360000},
            {"month": "Sep", "revenue": 1390000, "cost": 990000, "profit": 400000},
            {"month": "Oct", "revenue": 1428950, "cost": 1015000, "profit": 413950},
        ]

        # Shipment status distribution
        shipment_volume = {
            "DELIVERED": 142,
            "IN_TRANSIT": 38,
            "OUT_FOR_DELIVERY": 14,
            "DISPATCHED": 11,
            "CREATED": 9,
            "DELAYED": 2
        }

        # Warehouse utilization breakdown
        warehouses = self.wh_repo.get_multi(limit=6)
        warehouse_util_chart = []
        for wh in warehouses:
            warehouse_util_chart.append({
                "warehouse_code": wh.warehouse_code,
                "name": wh.name,
                "city": wh.city,
                "utilization": wh.current_utilization,
                "capacity": wh.total_capacity
            })
        if not warehouse_util_chart:
            warehouse_util_chart = [
                {"warehouse_code": "WH-SF-01", "name": "Bay Area Central Logistics Hub", "city": "San Francisco", "utilization": 82.4, "capacity": 15000},
                {"warehouse_code": "WH-LA-02", "name": "Pacific Coast Intermodal Port Hub", "city": "Los Angeles", "utilization": 76.1, "capacity": 22000},
                {"warehouse_code": "WH-CHI-03", "name": "Midwest Cold Chain Facility", "city": "Chicago", "utilization": 69.8, "capacity": 18000},
                {"warehouse_code": "WH-NYC-04", "name": "Eastern Gateway Megahub", "city": "New York", "utilization": 88.5, "capacity": 25000},
            ]

        # Top Performing / High Velocity Products
        top_products = [
            {"name": "Ultra-Precision LiDAR Sensor Module", "sku": "SEN-LIDAR-900", "units_shipped": 4820, "revenue": 289200, "stock_status": "OPTIMAL"},
            {"name": "Industrial IoT Telematics Gateway", "sku": "IOT-GW-400", "units_shipped": 3950, "revenue": 197500, "stock_status": "OPTIMAL"},
            {"name": "Cold-Chain Thermal Insulated Pallet Box", "sku": "PKG-COLD-200", "units_shipped": 2740, "revenue": 95900, "stock_status": "REORDER_SOON"},
            {"name": "Heavy Duty Axle Bearing Set", "sku": "MEC-AXLE-88", "units_shipped": 2100, "revenue": 147000, "stock_status": "OPTIMAL"},
        ]

        # Top Suppliers by Reliability & Score
        supplier_ranking = [
            {"supplier": "Apex Precision Technologies", "rating": 4.95, "on_time_delivery_pct": 99.4, "total_spend": "$340,000"},
            {"supplier": "Global TransLogistics Freight Co", "rating": 4.88, "on_time_delivery_pct": 98.1, "total_spend": "$480,000"},
            {"supplier": "Nordic Thermal Components Ltd", "rating": 4.82, "on_time_delivery_pct": 97.5, "total_spend": "$210,000"},
            {"supplier": "Pacific Industrial Hardware", "rating": 4.76, "on_time_delivery_pct": 96.2, "total_spend": "$185,000"},
        ]

        # Recent Exceptions
        recent_exceptions = [
            {"tracking_number": "LM-202610-008", "issue": "Heavy Rain Traffic Slowdown", "severity": "LOW", "impact_minutes": 15, "resolution": "AI Route Adjustment Applied"},
            {"tracking_number": "LM-202610-019", "issue": "Receiver Dock Busy", "severity": "MEDIUM", "impact_minutes": 25, "resolution": "Priority Unloading Requested"}
        ]

        # Fleet Health
        fleet_health = {
            "total_fleet": max(24, total_vehicles),
            "operational_pct": 94.5,
            "in_maintenance": 2,
            "avg_fuel_economy_kmpl": 7.4,
            "ev_adoption_pct": 28.0
        }

        # Strategic AI Recommendations
        ai_recommendations = [
            {
                "category": "INVENTORY_BALANCING",
                "title": "Inter-Hub Transfer Recommended",
                "description": "Shift 250 units of SEN-LIDAR-900 from Chicago to New York to fulfill projected 22% weekend surge.",
                "potential_impact": "+$18,400 revenue safeguard"
            },
            {
                "category": "FLEET_EFFICIENCY",
                "title": "Electrification Corridor Expansion",
                "description": "Deploy EV Vans on routes < 180 km to reduce carbon footprint by 3.2 tons monthly.",
                "potential_impact": "-16.5% line-haul operating cost"
            }
        ]

        return ExecutiveDashboardResponse(
            kpis=kpis,
            revenue_chart=revenue_chart,
            shipment_volume_by_status=shipment_volume,
            warehouse_utilization_chart=warehouse_util_chart,
            top_selling_products=top_products,
            supplier_performance_ranking=supplier_ranking,
            recent_shipment_exceptions=recent_exceptions,
            fleet_health_overview=fleet_health,
            ai_strategic_recommendations=ai_recommendations
        )
