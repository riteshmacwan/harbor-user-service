import { ServiceBusClient, ServiceBusSender, ServiceBusReceiver, ProcessErrorArgs } from "@azure/service-bus";
import * as handlers from "../service/messageHandlers";
import { CommonUtils } from "./common";

const commonUtils = CommonUtils.getInstance();

/**
 * Class to handle Azure Service Bus operations including sending and receiving messages.
 */
export class ServiceBusUtils {
    private static instance: ServiceBusUtils | null = null;
    private serviceBusClient: ServiceBusClient;
    private connectionString: string;

  // Singleton access method
  public static getInstance(): ServiceBusUtils {
      if (!ServiceBusUtils.instance) {
        const serviceBusUtils = new ServiceBusUtils();
        ServiceBusUtils.instance = serviceBusUtils;
      }
      return ServiceBusUtils.instance;
  }

  /**
   * Initializes the Service Bus client with the connection string obtained from Azure Key Vault.
   */
  private async ensureClientInitialized(): Promise<void> {
    if (!this.serviceBusClient) {
      console.log('New Initialise connection called ==> ');
      this.connectionString = await commonUtils.getSecret(`${process.env.NODE_ENV}-SERVICE-BUS-CONNECTION-STRING`);
      this.serviceBusClient = new ServiceBusClient(this.connectionString);
    }
  }

  /**
   * Sends a message to a specified Azure Service Bus queue.
   * @param {string} queueName - The name of the queue to send the message to.
   * @param {any} messageBody - The body of the message to send.
   */
  public async sendMessage(queueName: string, messageBody: any): Promise<void | string> {
    let sender: ServiceBusSender | null = null;
    try {
      await this.ensureClientInitialized();
      const client = this.serviceBusClient; // Waits for the existing or initially created client
      sender = client.createSender(queueName);

      let queueObject;
      if (messageBody.body) {
        queueObject = messageBody;
      } else {
        queueObject.body = messageBody;
      }

      if(!queueObject?.body?.data?.event){
        console.log(`MASS COMM: queueObject event not found:::: ${queueObject}`);
      }
      // Calculate the size of the message
      const messageSize = Buffer.byteLength(JSON.stringify(queueObject));
      const messageSizeKb = messageSize / 1024;
      console.log(`MASS COMM: Message size: ${messageSizeKb.toFixed(2)} KB for event ${queueObject?.body?.data?.event}`);
      if (messageSizeKb > 256) {
        console.log(`MASS COMM: Message size exceeds 256 KB for event ${queueObject?.body?.data?.event}`);
      }

      if (queueObject.scheduledEnqueueTimeUtc) {
        const sequenceNumber = await sender.scheduleMessages(queueObject, queueObject.scheduledEnqueueTimeUtc);
        console.log("Scheduled Message sent to queue:", queueName);
        console.log("sequenceNumber:", sequenceNumber);
        // If needed, convert the Long type to a native JS number
        const sequenceNumberJs = sequenceNumber.toString() // Convert Long to number if it's safe
        console.log(`Sequence number as a native JS number: ${sequenceNumberJs}`);
        return sequenceNumberJs;
      } else {
        const sentResponse = await sender.sendMessages(queueObject);
        console.log("Message sent to queue:", queueName);
        console.log("sentResponse:", sentResponse);
        return sentResponse;
      }

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
        console.log('In Finally!!!');
        if (sender) {
            await sender?.close();
        }
    }
  }

  /**
   * Subscribes to messages on a specified Azure Service Bus queue.
   * @param {string} queueName - The name of the queue to subscribe to.
   * @param {(message: any) => Promise<void>} processMessage - The function to process each message received.
   * @param {(error: Error) => void} processError - The function to handle errors that occur during message processing.
   */
  public async subscribeMessages(
    queueName: string,
    processMessage: (message: any) => Promise<void>,
    processError: (args: ProcessErrorArgs) => void
  ): Promise<void> {
    let receiver: ServiceBusReceiver;
    try {
      await this.ensureClientInitialized();
      const client = this.serviceBusClient;
      receiver = client.createReceiver(queueName);
      receiver.subscribe({
        processMessage: async (message) => {
          console.log(`Received message: ${message.body}`);
          await processMessage(message);
          await receiver.completeMessage(message);
        },
        processError: async (error) => {
          console.error("Error processing message:", error);
          processError(error);
        }
      },
      {
        maxConcurrentCalls: 10
      });
    } catch (error) {
      console.error("Error subscribing to messages:", error);
    }
  }

  /**
     * Starts listening on a specific queue or topic and dispatches messages based on the type specified in the message body.
     * @param {string} name - The name of the queue or topic to listen to.
     * @param {boolean} isTopic - True if the name refers to a topic, false if it refers to a queue.
     * @param {string} subscriptionName - The subscription name, required if isTopic is true.
     */
  public async startListening(name: string, isTopic: boolean = false, subscriptionName?: string): Promise<void> {
    let receiver: ServiceBusReceiver;
    try {
      await this.ensureClientInitialized();
        const client = this.serviceBusClient;
        if (isTopic) {
            if (!subscriptionName) {
                throw new Error("Subscription name must be provided for topic subscriptions.");
            }
            receiver = client.createReceiver(name, subscriptionName);
        } else {
            receiver = client.createReceiver(name);
        }

        receiver.subscribe({
          processMessage: async (message) => {
            console.log(`Received message of type ${message.body.type}: ${JSON.stringify(message.body)}`);
            const handler = handlers[message.body.type];
            if (handler) {
              await handler(message);
            } else {
              console.warn(`No handler registered for message type ${message.body.type}`);
            }
          },
          processError: async (error: ProcessErrorArgs) => {
            console.error(`Error processing message from ${name}:`, error);
          },
        }, {
          maxConcurrentCalls: 10
        });
        console.log(`Started listening on ${isTopic ? 'topic' : 'queue'} ${name}${isTopic ? ` with subscription ${subscriptionName}` : ''}`);
    } catch (error) {
        console.error(`Error setting up listener for ${isTopic ? 'topic' : 'queue'} ${name}:`, error);
    }
  }
}
