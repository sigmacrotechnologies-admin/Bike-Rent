import supportService from './support.service.js';
import { asyncHandler, successResponse, paginatedResponse } from '../../utils/response.js';
import { buildPaginationMeta } from '../../middlewares/validate.middleware.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class SupportController {
  create = asyncHandler(async (req, res) => {
    const ticket = await supportService.createTicket(req.user._id, req.body);
    return successResponse(res, ticket, 'Ticket created', HTTP_STATUS.CREATED);
  });

  list = asyncHandler(async (req, res) => {
    const { tickets, total } = await supportService.listTickets(req.query, req.user._id, req.user.role);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    return paginatedResponse(res, tickets, buildPaginationMeta(total, page, limit));
  });

  getById = asyncHandler(async (req, res) => {
    const ticket = await supportService.getTicket(req.params.id, req.user._id, req.user.role);
    return successResponse(res, ticket);
  });

  addMessage = asyncHandler(async (req, res) => {
    const ticket = await supportService.addMessage(req.params.id, req.user._id, req.body.message);
    return successResponse(res, ticket, 'Message added');
  });

  update = asyncHandler(async (req, res) => {
    const ticket = await supportService.updateTicket(req.params.id, req.body);
    return successResponse(res, ticket, 'Ticket updated');
  });
}

export default new SupportController();
