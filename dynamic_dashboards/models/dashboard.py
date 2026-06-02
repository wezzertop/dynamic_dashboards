from odoo import models, fields, api

class DynamicDashboard(models.Model):
    _name = 'dynamic.dashboard'
    _description = 'Dynamic Dashboard'
    
    name = fields.Char(string='Dashboard Name', required=True, translate=True)
    theme_color = fields.Selection([
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('dark', 'Dark'),
        ('gold', 'Gold')
    ], string='Theme Color', default='blue')
    
    auto_refresh = fields.Selection([
        ('0', 'Disabled'),
        ('60', 'Every 1 Minute'),
        ('300', 'Every 5 Minutes'),
        ('900', 'Every 15 Minutes')
    ], string='Auto Refresh', default='0')
    
    item_ids = fields.One2many('dynamic.dashboard.item', 'dashboard_id', string='Dashboard Items')
    group_ids = fields.Many2many('res.groups', string='Restricted to Groups', help="If empty, all users can see this dashboard.")
    active = fields.Boolean(default=True)
