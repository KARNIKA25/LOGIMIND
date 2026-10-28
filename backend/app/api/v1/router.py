from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, warehouses, products, inventory,
    suppliers, purchase_orders, shipments, vehicles,
    drivers, routes, locations, weather, ai_assistant,
    analytics, notifications
)

api_router = APIRouter()

api_router.include_router(auth.router,           prefix="/auth",            tags=["Authentication"])
api_router.include_router(users.router,          prefix="/users",           tags=["Users & Profiles"])
api_router.include_router(warehouses.router,     prefix="/warehouses",      tags=["Warehouse Management"])
api_router.include_router(products.router,       prefix="/products",        tags=["Product Catalog"])
api_router.include_router(inventory.router,      prefix="/inventory",       tags=["Inventory Management"])
api_router.include_router(suppliers.router,      prefix="/suppliers",       tags=["Supplier Management"])
api_router.include_router(purchase_orders.router,prefix="/purchase-orders", tags=["Purchase Orders"])
api_router.include_router(shipments.router,      prefix="/shipments",       tags=["Shipment Tracking"])
api_router.include_router(vehicles.router,       prefix="/vehicles",        tags=["Fleet - Vehicles"])
api_router.include_router(drivers.router,        prefix="/drivers",         tags=["Fleet - Drivers"])
api_router.include_router(routes.router,         prefix="/routes",          tags=["Route Optimization"])
api_router.include_router(locations.router,      prefix="/locations",       tags=["Location Services"])
api_router.include_router(weather.router,        prefix="/weather",         tags=["Weather Intelligence"])
api_router.include_router(ai_assistant.router,   prefix="/ai",              tags=["AI Engine & Forecasting"])
api_router.include_router(analytics.router,      prefix="/analytics",       tags=["Analytics & Dashboard"])
api_router.include_router(notifications.router,  prefix="/notifications",   tags=["Notifications & WebSocket"])
