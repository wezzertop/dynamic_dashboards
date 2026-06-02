from odoo import models, fields, api, _

class DynamicDashboardGenerator(models.TransientModel):
    _name = 'dynamic.dashboard.generator'
    _description = 'Smart Dashboard Generator'

    dashboard_id = fields.Many2one('dynamic.dashboard', string='Dashboard', required=True)
    model_id = fields.Many2one('ir.model', string='Data Model', required=True, domain=[('transient', '=', False)])
    line_ids = fields.One2many('dynamic.dashboard.generator.line', 'wizard_id', string='Proposed Items')

    @api.onchange('model_id')
    def _onchange_model_id(self):
        self.line_ids = [(5, 0, 0)]
        if not self.model_id:
            return
            
        model_name = self.model_id.model
        lines = []
        
        # Smart Templates Logic
        if model_name == 'sale.order':
            lines = [
                {'name': _('Sales by Customer'), 'chart_type': 'bar', 'group_by_field_name': 'partner_id', 'measure_field_name': 'amount_total', 'col_span': '6'},
                {'name': _('Sales by Date'), 'chart_type': 'area', 'date_field_name': 'date_order', 'measure_field_name': 'amount_total', 'col_span': '6'},
                {'name': _('Sales by Status'), 'chart_type': 'doughnut', 'group_by_field_name': 'state', 'measure_field_name': 'amount_total', 'col_span': '4'},
                {'name': _('Salesperson Performance'), 'chart_type': 'polarArea', 'group_by_field_name': 'user_id', 'measure_field_name': 'amount_total', 'col_span': '4'},
                {'name': _('Quotations vs Confirmed'), 'chart_type': 'pie', 'group_by_field_name': 'state', 'measure_field_name': 'id', 'col_span': '4'},
                {'name': _('Total Revenue'), 'chart_type': 'kpi', 'measure_field_name': 'amount_total', 'col_span': '3'},
                {'name': _('Total Orders'), 'chart_type': 'kpi', 'measure_field_name': 'id', 'col_span': '3'}
            ]
        elif model_name == 'purchase.order':
            lines = [
                {'name': _('Purchases by Vendor'), 'chart_type': 'bar', 'group_by_field_name': 'partner_id', 'measure_field_name': 'amount_total', 'col_span': '6'},
                {'name': _('Purchases over Time'), 'chart_type': 'line', 'date_field_name': 'date_order', 'measure_field_name': 'amount_total', 'col_span': '6'},
                {'name': _('Status Overview'), 'chart_type': 'pie', 'group_by_field_name': 'state', 'measure_field_name': 'amount_total', 'col_span': '4'},
                {'name': _('Total Spent'), 'chart_type': 'kpi', 'measure_field_name': 'amount_total', 'col_span': '3'}
            ]
        elif model_name == 'account.move':
            lines = [
                {'name': _('Invoices by Partner'), 'chart_type': 'bar', 'group_by_field_name': 'partner_id', 'measure_field_name': 'amount_total', 'col_span': '6'},
                {'name': _('Revenue over Time'), 'chart_type': 'area', 'date_field_name': 'invoice_date', 'measure_field_name': 'amount_total', 'col_span': '6'},
                {'name': _('Total Invoiced'), 'chart_type': 'kpi', 'measure_field_name': 'amount_total', 'col_span': '3'}
            ]
        elif model_name == 'stock.picking':
            lines = [
                {'name': _('Transfers by Status'), 'chart_type': 'doughnut', 'group_by_field_name': 'state', 'measure_field_name': 'id', 'col_span': '6'},
                {'name': _('Transfers by Type'), 'chart_type': 'pie', 'group_by_field_name': 'picking_type_id', 'measure_field_name': 'id', 'col_span': '6'}
            ]
        else:
            # Generic Fallback
            lines = [
                {'name': _('Records by Creator'), 'chart_type': 'bar', 'group_by_field_name': 'create_uid', 'measure_field_name': 'id', 'col_span': '6'},
                {'name': _('Records by Date'), 'chart_type': 'line', 'date_field_name': 'create_date', 'measure_field_name': 'id', 'col_span': '6'}
            ]
            
        self.line_ids = [(0, 0, line) for line in lines]

    def action_generate(self):
        for line in self.line_ids.filtered(lambda l: l.selected):
            self.env['dynamic.dashboard.item'].create({
                'name': line.name,
                'dashboard_id': self.dashboard_id.id,
                'model_id': self.model_id.id,
                'chart_type': line.chart_type,
                'col_span': line.col_span,
                'group_by_field_id': self.env['ir.model.fields'].search([('model_id', '=', self.model_id.id), ('name', '=', line.group_by_field_name)], limit=1).id if line.group_by_field_name else False,
                'measure_field_id': self.env['ir.model.fields'].search([('model_id', '=', self.model_id.id), ('name', '=', line.measure_field_name)], limit=1).id if line.measure_field_name else False,
                'date_field_id': self.env['ir.model.fields'].search([('model_id', '=', self.model_id.id), ('name', '=', line.date_field_name)], limit=1).id if line.date_field_name else False,
            })
        return {'type': 'ir.actions.client', 'tag': 'reload'}


class DynamicDashboardGeneratorLine(models.TransientModel):
    _name = 'dynamic.dashboard.generator.line'
    _description = 'Dashboard Generator Line'

    wizard_id = fields.Many2one('dynamic.dashboard.generator', required=True, ondelete='cascade')
    selected = fields.Boolean(default=True, string='Select')
    name = fields.Char('Title')
    chart_type = fields.Selection([
        ('kpi', 'KPI Card'),
        ('bar', 'Bar Chart'),
        ('line', 'Line Chart'),
        ('pie', 'Pie Chart'),
        ('doughnut', 'Doughnut Chart'),
        ('radar', 'Radar Chart'),
        ('polarArea', 'Polar Area Chart'),
        ('area', 'Area Chart'),
        ('list', 'List View (Data Table)')
    ], string='Type')
    col_span = fields.Selection([('3', '1/4'), ('4', '1/3'), ('6', '1/2'), ('8', '2/3'), ('12', 'Full')])
    
    group_by_field_name = fields.Char()
    measure_field_name = fields.Char()
    date_field_name = fields.Char()
