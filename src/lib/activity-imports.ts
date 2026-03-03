import { ActivityImport, ActivityType } from "@wealthfolio/addon-sdk";
import { Row } from "../types";

export function rowsToActivityImports(rows: Row[], accountId: string): ActivityImport[] {
    return rows
        .map((row, index): ActivityImport | null => {
            if (!row.transaction) return null;

            const { transaction, error } = row;

            return {
                accountId,
                activityType: transaction.activityType as ActivityType,
                date: transaction.date,
                symbol: transaction.symbol,
                quantity: transaction.quantity ?? undefined,
                unitPrice: transaction.unitPrice,
                amount: transaction.amount,
                currency: transaction.currency,
                fee: transaction.fee,
                comment: transaction.comment ?? undefined,

                // Metadata
                isValid: error.length === 0,
                errors: error.length
                    ? { general: [error] }
                    : undefined,
                lineNumber: index,
                isDraft: true,
            };
        })
        .filter((v): v is ActivityImport => v !== null);
}
