# Premium Dynamic Dashboards Pro 📊

Turn your Odoo Community data into powerful, real-time Business Intelligence dashboards. Build custom dashboards for Sales, CRM, Inventory, Purchases, Project, or any custom Odoo model—with zero lines of code.

---

## 📖 Table of Contents
1. [Overview](#-overview)
2. [Functional Apartados (Module Sections)](#-functional-apartados-module-sections)
   - [Dashboard Boards Management](#1-dashboard-boards-management)
   - [Chart Widget Configurator](#2-chart-widget-configurator)
   - [Smart Auto-Generator Panel](#3-smart-auto-generator-panel)
3. [Chart Types Guide](#-chart-types-guide)
4. [Advanced UX & Layout Tools](#-advanced-ux--layout-tools)
5. [User Customization Options](#-user-customization-options)
6. [Drill-Down & Interactivity](#-drill-down--interactivity)
7. [Step-by-Step Configuration Guide](#-step-by-step-configuration-guide)
8. [Technical Architecture](#-technical-architecture)

---

## 🔍 Overview

**Premium Dynamic Dashboards Pro** provides Odoo users with a drag-and-drop workspace where they can place, resize, and configure multiple types of charts (Bar, Line, Area, Pie, Doughnut, KPI, Tables).

It runs **100% on the client-side** using the Odoo Web Library (OWL) and Chart.js, avoiding Odoo server compilation blocks or risky database migrations.

---

## 📂 Functional Apartados (Module Sections)

### 1. Dashboard Boards Management
The control hub for all dashboards.
- **Dynamic Quick Filters**: Located in the dashboard header, users can instantly change dates across all charts (Today, This Week, This Month, This Quarter, This Year, Custom Date Range, All Time).
- **Auto-Organize Grid**: Click the **Auto-Organize** button (magic wand icon) in the header. The system runs an optimization algorithm that repositions and resizes your widgets to a professional format (KPIs on top, primary charts in the middle, lists on the bottom).
- **Grid Reordering**: Drag and drop cards by their drag handles to customize order.

### 2. Chart Widget Configurator
A flexible form model (`dynamic.dashboard.item`) to configure each data source.
- **Odoo Model Selector**: Select *any* registered database table in your system.
- **Domain Filter Builder**: Add query rules using Odoo's standard domain syntax (e.g. `[('state', '=', 'sale'), ('user_id', '=', uid)]`) to segment your metrics.
- **Field Measure Selection**: Aggregate numerical values using Sum, Average, Minimum, Maximum, or Record Count.
- **Dimension Grouping**: Group data by relational links (Many2one like Customer, Product, Employee), statuses (Selection fields like State, Stage), or Date fields (automatically grouped by Day, Week, Month, Quarter, or Year).
- **Record Limits**: Restrict charts to Top 5, 10, 20, or 50 records to focus on major contributors.

### 3. Smart Auto-Generator Panel
Empowers users to build analytics on a blank model instantly.
- **Metadata Analyzer**: When creating a new dashboard, select a model and click "Smart Generate". The backend scans the model's schema to detect available field types.
- **Smart Fields Classification**:
  - Finds the most relevant date field (e.g. `date_order`, `create_date`, `date_done`).
  - Finds the primary monetary/measure field (e.g. `amount_total`, `price_subtotal`, `quantity`).
  - Finds relational fields (e.g. `partner_id`, `product_id`).
- **Instantiates 6 Proposed Charts**: Automatically designs and inserts 2 KPIs, 1 Bar chart, 1 Line chart, 1 Pie chart, and 1 Data Table formatted specifically to the model's schema.

---

## 📈 Chart Types Guide

Each chart type is optimized for specific analytic needs:

*   **KPI Cards (Key Performance Indicator)**: Displays a single, highlighted aggregated number (e.g., Total Invoiced Amount, Average Deal Size, Total Confirmed Orders). Ideal for putting high-level goals at the top of the dashboard.
*   **Bar Chart**: Renders horizontal or vertical bars. Recommended for comparing categorical segments (e.g., revenue generated per salesperson, stock levels per category).
*   **Line Chart**: Draws continuous trend lines. Recommended for tracking performance over chronological timelines (e.g., monthly sales progression, daily log entries).
*   **Area Chart**: Similar to line charts, but fills the space under the line with semi-transparent colors. Perfect for cumulative metrics or volume trends.
*   **Pie & Doughnut Charts**: Circular charts divided into sectors. Recommended for displaying percentage shares of a whole (e.g., total sales divided by product category, leads by medium).
*   **Detailed Data Tables (Lists)**: Renders a scrollable grid list containing categories and values. Recommended for reading raw top-performer rankings.

---

## 🛠 Advanced UX & Layout Tools

To deliver a premium presentation, the module includes several user experience enhancements:
- **Y-Axis Grace Padding**: Extends the chart's vertical grid by **15%** beyond the highest data value. This prevents the floating data labels at the top of bar/line charts from getting clipped by the canvas frame.
- **Scrollable Dropdown Options**: The options panel on each chart is limited to `280px` maximum height with a scrollbar, preventing option lists from clipping below screen boundaries.
- **Cross-Dashboard Copying**: Clone visualizations instantly. Click "Copy to Dashboard" under the options menu to select any other dashboard board and copy the configuration over.
- **Export Capabilities**:
  - **Export CSV**: Downloads the chart's current aggregated data directly to an Excel-friendly CSV.
  - **Export PNG**: Exports the Chart.js canvas render into a high-quality PNG image for presentations.

---

## 🎨 User Customization Options

Under the 3-dots menu on each chart, users can adjust visual styles:
1.  **Color Themes**: Apply preset colors (Default Theme, Cool Blues, Warm Reds, Emerald Greens, Royal Purples, Random).
2.  **Hex Color Picker**: Choose a custom base color. The system uses a linear HSL algorithm to shift hue (+12° per step) and lightness (30% to 75%) to output highly distinguishable gradient shades.
3.  **Toggles**:
    *   **Data Labels**: Toggle showing exact values directly above bars/points.
    *   **Show Legend**: Toggle displaying data series legends at the bottom.
    *   **Show Gridlines**: Toggle axes background lines.
    *   **Smooth Lines**: Toggle curve interpolation (tension) on Line/Area charts.
    *   **Rounded Bars**: Toggle rounded borders on Bar charts.
    *   **Animations**: Enable/disable Chart.js rendering animations.
4.  **Dark/Light Mode Persistence**: All visual customization settings are stored in the user's browser `localStorage` keyed by widget ID. If the user toggles dark mode, the dashboard redraws text colors and grids appropriately without losing custom themes.

---

## 🖱 Drill-Down & Interactivity

Our dashboards are fully actionable:
- **Click-to-Explore**: Clicking any bar segment, pie slice, or row inside a detailed table launches a dynamic action window opening the underlying Odoo document list.
- **Contextual Aggregation**: The opened list is automatically filtered by both the clicked category/dimension and the active global header date range.

---

## 🚀 Step-by-Step Configuration Guide

Follow these steps to construct your first business intelligence board:

### Step 1: Create a Dashboard Board
1. Open the **Dashboards** app menu.
2. Select **Configuration > Dashboards Setup** and click **New**.
3. Provide a name (e.g. *Manufacturing Intelligence*).
4. Save the board.

### Step 2: Use the Smart Auto-Generator (Optional but Recommended)
1. In the board view, look for the **Smart Generator** section.
2. Choose your target model (e.g., `mr.production` for Manufacturing Orders).
3. Click **Smart Generate**.
4. The system will automatically build, organize, and show a full analytical layout.

### Step 3: Create Custom Chart Items Manually
1. Under **Dashboards Setup**, open your board and click **Add Line** in the Items list.
2. Enter a **Name** (e.g. *Top 10 Customers*).
3. Set the **Chart Type** to *Bar Chart*.
4. Select the **Odoo Model** as *Sale Order*.
5. In **Group By**, select *Customer (partner_id)*.
6. In **Measure Field**, select *Total (amount_total)*.
7. In **Limit**, choose *Top 10*.
8. (Optional) Set a domain filter like `[('state', '=', 'sale')]` to filter draft quotes out.
9. Save.

### Step 4: Organize and Style
1. Go to the main **Dashboard** view to view your board.
2. Click the **Magic Wand (Auto-Organize)** icon in the header to layout the items.
3. Use the 3-dots dropdown menu on the top-right of your charts to change color themes, enable rounded corners, toggle grid lines, or copy charts.

---

## 💻 Technical Architecture

*   **Frontend Components**: Constructed with Odoo Web Library (OWL) `Component` classes.
*   **Asset Management**: Loads Chart.js from a CDN and packages css/js assets dynamically inside `web.assets_backend`.
*   **State Management**: Reactivity is driven by OWL `useState`. Configuration parameters are synchronized into local storage variables:
    *   `dashboard_item_color_theme_[id]`
    *   `dashboard_item_custom_color_[id]`
    *   `dashboard_item_show_labels_[id]`
    *   `dashboard_item_show_legend_[id]`
    *   `dashboard_item_show_grid_[id]`
    *   `dashboard_item_smooth_[id]`
    *   `dashboard_item_rounded_[id]`
    *   `dashboard_item_animate_[id]`
*   **Data Aggregation**: Handled entirely through Odoo ORM `read_group()` queries inside `fetch_dashboard_data`, avoiding direct SQL calls to preserve access control lists and multi-company rules.

---
**Author**: JDDM
**Version**: 18.0.1.0.0
**License**: OPL-1
