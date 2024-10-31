import * as appInsights from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/src/declarations/generated';
import {CommonUtils} from './common';

const commonUtils = CommonUtils.getInstance();

const HOST = process.env.HOST_URL ?? "localhost";
const PORT = process.env.HOST_PORT ?? 3000;

class AppInsightsUtils {
    private static instance: AppInsightsUtils;
    private insights: appInsights.TelemetryClient | null = null;

    /**
     * The constructor is private to prevent direct construction calls with the `new` operator.
     */
    private constructor() {
        this.initialize();
    }

    /**
     * The static method that controls access to the singleton instance.
     * On the first run, it creates a singleton object and places it into the static field.
     * On subsequent runs, it returns the client existing in the static field.
     */
    public static getInstance(): AppInsightsUtils {
        if (!AppInsightsUtils.instance) {
            AppInsightsUtils.instance = new AppInsightsUtils();
        }
        return AppInsightsUtils.instance;
    }

    /**
     * Initializes Application Insights with environment specific instrumentation key.
     */
    private async initialize(): Promise<void> {
        if (process.env.NODE_ENV !== "local") {
            const instrumentationKey = await commonUtils.getSecret(`${process.env.NODE_ENV}-APP-INSIGHTS-CONNECTION-STRING`);

            if (instrumentationKey) {
              appInsights
                .setup(instrumentationKey)
                .setAutoDependencyCorrelation(true)
                .setAutoCollectRequests(true)
                .setAutoCollectPerformance(true, true)
                .setAutoCollectExceptions(true)
                .setAutoCollectDependencies(true)
                .setAutoCollectConsole(true, true)
                .setUseDiskRetryCaching(true)
                .start();

              this.insights = appInsights.defaultClient;
              this.insights.config.samplingPercentage = 20;
              this.insights.context.keys.cloudRole = "Node.js Service";
              this.insights.context.tags[this.insights.context.keys.cloudRoleInstance] = `http://${HOST}:${PORT}`;
            } else {
              console.error("Application Insights Instrumentation Key is not set");
            }
          }
    }

    public logMessage(message: string, severityLevel: SeverityLevel = "Information"): void {
        this.insights?.trackTrace({ message, severity: severityLevel });
    }

    public logException(exception: Error, properties: {}): void {
        this.insights?.trackException({ exception, properties });
    }

    public logMetric(name: string, value: number): void {
        this.insights?.trackMetric({ name, value });
    }

    public logEvent(name: string, properties?: { [key: string]: string }): void {
        this.insights?.trackEvent({ name, properties });
    }
}

export default AppInsightsUtils.getInstance();
