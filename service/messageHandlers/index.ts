// src/services/messageHandlers/index.ts

/**
 * @fileoverview This file serves as an export hub for all message handlers used in the
 * application. It consolidates all handlers into a single point for easy import
 * elsewhere in the application, thereby promoting cleaner and more maintainable code.
 * Each handler is responsible for processing specific types of messages received from
 * the service bus.
 */

export { handleMassCommHandler } from "./massComHandler";

/**
 * Future message handlers should be added here following the pattern demonstrated above.
 * This approach simplifies the management of message handling functions and enhances
 * the scalability of the message processing architecture.
 */
