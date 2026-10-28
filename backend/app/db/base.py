# Import all models so Base has them registered for Alembic and metadata creation
from app.db.session import Base
from app.models.user import User, UserProfile, OTPRecord, UserRole
from app.models.warehouse import Warehouse, StorageZone, WarehouseStatus
from app.models.product import Product, ProductSupplierMap
from app.models.supplier import Supplier
from app.models.inventory import Inventory, StockTransfer, StockAudit, StockHistory, StockTransferStatus
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus
from app.models.vehicle import Vehicle, MaintenanceLog, VehicleType, VehicleStatus
from app.models.driver import Driver, DrivingIncident, DriverStatus
from app.models.shipment import Shipment, ShipmentEvent, ShipmentStatus, ShipmentPriority
from app.models.route import RoutePlan, RouteOptimizationLog, RouteStrategy
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.models.audit_log import AuditLog
from app.models.ai_prediction import DemandForecast, DelayPrediction, AIInsight

__all__ = [
    "Base",
    "User",
    "UserProfile",
    "OTPRecord",
    "UserRole",
    "Warehouse",
    "StorageZone",
    "WarehouseStatus",
    "Product",
    "ProductSupplierMap",
    "Supplier",
    "Inventory",
    "StockTransfer",
    "StockAudit",
    "StockHistory",
    "StockTransferStatus",
    "PurchaseOrder",
    "PurchaseOrderItem",
    "POStatus",
    "Vehicle",
    "MaintenanceLog",
    "VehicleType",
    "VehicleStatus",
    "Driver",
    "DrivingIncident",
    "DriverStatus",
    "Shipment",
    "ShipmentEvent",
    "ShipmentStatus",
    "ShipmentPriority",
    "RoutePlan",
    "RouteOptimizationLog",
    "RouteStrategy",
    "Notification",
    "NotificationType",
    "NotificationPriority",
    "AuditLog",
    "DemandForecast",
    "DelayPrediction",
    "AIInsight",
]
