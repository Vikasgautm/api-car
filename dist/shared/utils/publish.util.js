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
        const pk = model.primaryKey || 'id';
        await model.updateDirect({ [pk]: id }, updateData);
        return await model.findOne({ [pk]: id });
    }
    static async unpublish(model, id, unpublishedBy) {
        const updateData = {
            is_published: false,
            unpublished_at: new Date(),
        };
        if (unpublishedBy) {
            updateData.unpublished_by = unpublishedBy;
        }
        const pk = model.primaryKey || 'id';
        await model.updateDirect({ [pk]: id }, updateData);
        return await model.findOne({ [pk]: id });
    }
    static async togglePublish(model, id, userId) {
        const pk = model.primaryKey || 'id';
        const document = await model.findOne({ [pk]: id });
        if (!document) {
            return null;
        }
        if (document.is_published) {
            return await this.unpublish(model, id, userId);
        }
        else {
            return await this.publish(model, id, userId);
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
        const pk = model.primaryKey || 'id';
        const count = await model.updateDirect({ ...filter, is_published: false }, updateData);
        return { modifiedCount: count };
    }
    static async unpublishMany(model, filter, unpublishedBy) {
        const updateData = {
            is_published: false,
            unpublished_at: new Date(),
        };
        if (unpublishedBy) {
            updateData.unpublished_by = unpublishedBy;
        }
        const pk = model.primaryKey || 'id';
        const count = await model.updateDirect({ ...filter, is_published: true }, updateData);
        return { modifiedCount: count };
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
