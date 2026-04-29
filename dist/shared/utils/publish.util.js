"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishUtil = void 0;
class PublishUtil {
    static async publish(model, id, publishedBy) {
        const updateData = {
            is_published: true,
            published_at: new Date(),
            unpublished_at: null,
            unpublished_by: null,
        };
        if (publishedBy) {
            updateData.published_by = publishedBy;
        }
        return await model.findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true });
    }
    static async unpublish(model, id, unpublishedBy) {
        const updateData = {
            is_published: false,
            unpublished_at: new Date(),
        };
        if (unpublishedBy) {
            updateData.unpublished_by = unpublishedBy;
        }
        return await model.findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true });
    }
    static async togglePublish(model, id, userId) {
        const document = await model.findById(id);
        if (!document) {
            return null;
        }
        if (document.is_published) {
            return (await this.unpublish(model, id, userId));
        }
        else {
            return (await this.publish(model, id, userId));
        }
    }
    static async publishMany(model, filter, publishedBy) {
        const updateData = {
            is_published: true,
            published_at: new Date(),
            unpublished_at: null,
            unpublished_by: null,
        };
        if (publishedBy) {
            updateData.published_by = publishedBy;
        }
        const result = await model.updateMany({ ...filter, is_published: false }, updateData);
        return { modifiedCount: result.modifiedCount || 0 };
    }
    static async unpublishMany(model, filter, unpublishedBy) {
        const updateData = {
            is_published: false,
            unpublished_at: new Date(),
        };
        if (unpublishedBy) {
            updateData.unpublished_by = unpublishedBy;
        }
        const result = await model.updateMany({ ...filter, is_published: true }, updateData);
        return { modifiedCount: result.modifiedCount || 0 };
    }
    static isPublished(document) {
        return document?.is_published === true;
    }
    static addPublishedFilter(filter, field = 'is_published', published = true) {
        return { ...filter, [field]: published };
    }
    static addUnpublishedFilter(filter, field = 'is_published') {
        return { ...filter, [field]: false };
    }
    static removePublishFilter(filter, field = 'is_published') {
        const { [field]: removed, ...rest } = filter;
        return rest;
    }
    static getPublishStatus(document) {
        if (!document) {
            return {
                isPublished: false,
            };
        }
        return {
            isPublished: document.is_published === true,
            publishedAt: document.published_at,
            publishedBy: document.published_by,
            unpublishedAt: document.unpublished_at,
            unpublishedBy: document.unpublished_by,
        };
    }
}
exports.PublishUtil = PublishUtil;
//# sourceMappingURL=publish.util.js.map