/**
 * Controladores: solo traducen HTTP <-> servicios. No contienen reglas de negocio.
 * ctx = { tenantId, user } se construye a partir del token (middlewares auth + tenant).
 */
const authService = require('../services/authService');
const userService = require('../services/userService');
const clientService = require('../services/clientService');
const catalogService = require('../services/catalogService');
const employeeService = require('../services/employeeService');
const availabilityService = require('../services/availabilityService');
const appointmentService = require('../services/appointmentService');
const calendarService = require('../services/calendarService');
const dashboardService = require('../services/dashboardService');

const ctx = (req) => ({ tenantId: req.tenantId, user: req.user });

module.exports = {
  auth: {
    register: async (req, res) => res.status(201).json(await authService.registerTenant(req.body)),
    login: async (req, res) => res.json(await authService.login(req.body)),
    me: async (req, res) => res.json(await authService.me(ctx(req))),
  },
  users: {
    list: async (req, res) => res.json(await userService.list(ctx(req))),
    create: async (req, res) => res.status(201).json(await userService.create(ctx(req), req.body)),
    changeRole: async (req, res) => res.json(await userService.changeRole(ctx(req), req.params.id, req.body.role)),
  },
  clients: {
    list: async (req, res) => res.json(await clientService.list(ctx(req), req.query)),
    get: async (req, res) => res.json(await clientService.get(ctx(req), req.params.id)),
    create: async (req, res) => res.status(201).json(await clientService.create(ctx(req), req.body)),
    update: async (req, res) => res.json(await clientService.update(ctx(req), req.params.id, req.body)),
    remove: async (req, res) => res.json(await clientService.remove(ctx(req), req.params.id)),
  },
  services: {
    list: async (req, res) => res.json(await catalogService.list(ctx(req), req.query)),
    get: async (req, res) => res.json(await catalogService.get(ctx(req), req.params.id)),
    create: async (req, res) => res.status(201).json(await catalogService.create(ctx(req), req.body)),
    update: async (req, res) => res.json(await catalogService.update(ctx(req), req.params.id, req.body)),
  },
  employees: {
    list: async (req, res) => res.json(await employeeService.list(ctx(req), req.query)),
    get: async (req, res) => res.json(await employeeService.get(ctx(req), req.params.id)),
    create: async (req, res) => res.status(201).json(await employeeService.create(ctx(req), req.body)),
    update: async (req, res) => res.json(await employeeService.update(ctx(req), req.params.id, req.body)),
    setSchedule: async (req, res) =>
      res.json(await employeeService.setSchedule(ctx(req), req.params.id, req.body.schedule)),
  },
  availability: {
    get: async (req, res) => res.json(await availabilityService.getAvailability(ctx(req), req.query)),
  },
  appointments: {
    search: async (req, res) => res.json(await appointmentService.search(ctx(req), req.query)),
    mine: async (req, res) => res.json(await appointmentService.mine(ctx(req))),
    calendar: async (req, res) => res.json(await calendarService.getCalendar(ctx(req), req.query)),
    get: async (req, res) => res.json(await appointmentService.get(ctx(req), req.params.id)),
    create: async (req, res) => res.status(201).json(await appointmentService.create(ctx(req), req.body)),
    update: async (req, res) => res.json(await appointmentService.update(ctx(req), req.params.id, req.body)),
    cancel: async (req, res) => res.json(await appointmentService.cancel(ctx(req), req.params.id, req.body.reason)),
    status: async (req, res) =>
      res.json(await appointmentService.changeStatus(ctx(req), req.params.id, req.body.status)),
  },
  dashboard: {
    get: async (req, res) => res.json(await dashboardService.getDashboard(ctx(req), req.query)),
  },
};
