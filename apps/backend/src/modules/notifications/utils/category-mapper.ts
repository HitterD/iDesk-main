import { NotificationType, NotificationCategory } from '../entities/notification.entity';

/**
 * Maps a NotificationType to its corresponding NotificationCategory
 * Used to automatically categorize notifications for filtering in the UI
 */
export function getCategoryFromType(type: NotificationType): NotificationCategory {
    const renewalTypes: NotificationType[] = [
        NotificationType.RENEWAL_D60_WARNING,
        NotificationType.RENEWAL_D30_WARNING,
        NotificationType.RENEWAL_D7_WARNING,
        NotificationType.RENEWAL_D1_WARNING,
        NotificationType.RENEWAL_EXPIRED,
        NotificationType.VPN_EXPIRY_D60,
        NotificationType.VPN_EXPIRY_D30,
        NotificationType.VPN_EXPIRY_D7,
        NotificationType.VPN_EXPIRY_D1,
    ];

    const hardwareTypes: NotificationType[] = [
        NotificationType.ICT_BUDGET_CREATED,
        NotificationType.ICT_BUDGET_APPROVED,
        NotificationType.ICT_BUDGET_REJECTED,
        NotificationType.ICT_BUDGET_ARRIVED,
        NotificationType.HARDWARE_INSTALL_REQUESTED,
        NotificationType.HARDWARE_INSTALL_APPROVED,
        NotificationType.HARDWARE_INSTALL_RESCHEDULED,
        NotificationType.HARDWARE_INSTALL_COMPLETED,
        NotificationType.HARDWARE_INSTALL_D1,
        NotificationType.HARDWARE_INSTALL_D0,
    ];

    const zoomTypes: NotificationType[] = [
        NotificationType.ZOOM_BOOKING_CONFIRMED,
        NotificationType.ZOOM_BOOKING_CANCELLED,
        NotificationType.ZOOM_BOOKING_REMINDER,
    ];

    const eformTypes: NotificationType[] = [
        NotificationType.EFORM_SUBMITTED,
        NotificationType.EFORM_MANAGER1_APPROVED,
        NotificationType.EFORM_MANAGER2_APPROVED,
        NotificationType.EFORM_ICT_CONFIRMED,
        NotificationType.EFORM_REJECTED,
        NotificationType.EFORM_CREDENTIALS_READY,
    ];

    if (renewalTypes.includes(type)) return NotificationCategory.CATEGORY_RENEWAL;
    if (hardwareTypes.includes(type)) return NotificationCategory.CATEGORY_HARDWARE;
    if (zoomTypes.includes(type)) return NotificationCategory.CATEGORY_ZOOM;
    if (eformTypes.includes(type)) return NotificationCategory.CATEGORY_EFORM;

    // Everything else falls back to Ticket category
    return NotificationCategory.CATEGORY_TICKET;
}

/**
 * Check if a notification type is renewal-related
 */
export function isRenewalNotification(type: NotificationType): boolean {
    return getCategoryFromType(type) === NotificationCategory.CATEGORY_RENEWAL;
}

/**
 * Check if a notification type is ticket-related
 */
export function isTicketNotification(type: NotificationType): boolean {
    return getCategoryFromType(type) === NotificationCategory.CATEGORY_TICKET;
}

/**
 * Check if a notification type is hardware-related
 */
export function isHardwareNotification(type: NotificationType): boolean {
    return getCategoryFromType(type) === NotificationCategory.CATEGORY_HARDWARE;
}

/**
 * Check if a notification type is zoom-related
 */
export function isZoomNotification(type: NotificationType): boolean {
    return getCategoryFromType(type) === NotificationCategory.CATEGORY_ZOOM;
}
