import assetService from './asset.service.js';
import { asyncHandler, successResponse } from '../../utils/response.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class AssetController {
  listVehicleImages = asyncHandler(async (req, res) => {
    const images = await assetService.listVehicleImages();
    return successResponse(res, images);
  });

  uploadVehicleImage = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const folder = assetService.getUploadFolder(req.body.type);
    const publicPath = assetService.buildPublicPath(folder, req.file.filename);

    return successResponse(
      res,
      {
        path: publicPath,
        name: req.file.filename,
        folder,
      },
      'Image uploaded',
      HTTP_STATUS.CREATED
    );
  });

  uploadUserPhoto = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const publicPath = assetService.buildUserPublicPath(req.file.filename);
    return successResponse(
      res,
      { path: publicPath, name: req.file.filename },
      'Photo uploaded',
      HTTP_STATUS.CREATED
    );
  });
}

export default new AssetController();
