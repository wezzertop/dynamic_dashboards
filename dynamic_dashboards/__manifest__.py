{
    'name': 'Premium Dynamic Dashboards Pro',
    'version': '18.0.1.0.0',
    'category': 'Extra Tools',
    'summary': 'Create custom dashboards with pie, bar, and line charts dynamically from any Odoo model.',
    'description': """
Premium Dynamic Dashboards Pro
==============================
Empower your business with real-time analytics. Build custom dashboards for Sales, Inventory, Purchases, and more without writing a single line of code.

Key Features:
- Drag & Drop Grid Layout with Auto-Organize button to instantly arrange KPIs, main/secondary charts, and lists.
- Smart Dynamic Fallback Generator: Automatically scans custom models' metadata to suggest date, measure, and relational fields.
- Dynamic Data Grouping and Filtering.
- Chart Types: Bar, Line, Area, Pie, Doughnut, KPI Cards, and Data Tables.
- Copy Charts: Clone and transfer charts between dashboards.
- Persisted Formatting Tools: Toggle gridlines, legends, smooth lines, rounded bars, data labels, and animations.
- HSL Shift custom base color shade generator for highly distinct and distinguishable variations.
- Dark/Light mode visual persistence (settings saved inside localStorage).
- Export to Excel-friendly CSV or high-resolution PNG image.
- Responsive and modern OWL frontend.
    """,
    'author': 'JDDM',
    'depends': ['base', 'web', 'board'],
    'data': [
        'security/ir.model.access.csv',
        'security/security_rules.xml',
        'views/dashboard_generator_views.xml',
        'views/dashboard_views.xml',
        'views/dashboard_item_views.xml',
        'views/menus.xml',
        'views/demo_data_wizard_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'dynamic_dashboards/static/src/css/dashboard.css',
            'dynamic_dashboards/static/src/xml/chart_widget.xml',
            'dynamic_dashboards/static/src/xml/dashboard_view.xml',
            'dynamic_dashboards/static/src/xml/preview_widget.xml',
            'dynamic_dashboards/static/src/js/chart_widget.js',
            'dynamic_dashboards/static/src/js/dashboard_action.js',
            'dynamic_dashboards/static/src/js/preview_widget.js',
            'https://cdn.jsdelivr.net/npm/chart.js',
        ],
    },
    'images': ['static/description/banner.gif', 'static/description/icon.png'],
    'price': 15.00,
    'currency': 'USD',
    'installable': True,
    'application': True,
    'license': 'OPL-1',
}
