/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/************************************************************************************************ 
*
* OTP-9787:Custom page for display sales order based on the status
*
**************************************************************************************************
*
* Author:Jobin and Jismi IT Services
*
* Date Created: 30-October-2025
*
* Description:This script is designed to create a custom form that displays sales orders requiring 
* fulfillment or billing. It includes a Sublist with multiple columns and filters, such as Status, 
* Subsidiary, Customer, and Department, ensuring that the displayed data dynamically updates based
* on the selected filters. 
*
* REVISION HISTORY
*
* @version 1.0 30-October-2025 : Created the initial build by JJ0417
*************************************************************************************************/

define(["N/log", "N/record", "N/search", "N/ui/serverWidget"],
    /**
     * @param{log} log
     * @param{record} record
     * @param{search} search
     * @param{serverWidget} serverWidget
     */
    (log, record, search, serverWidget) => {

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                let SalesOrdform = createForm();
                if (!SalesOrdform) {
                    throw new Error("Failed to create form");
                }
                applyDefaultValues(SalesOrdform, scriptContext);
                populateSublist(SalesOrdform, scriptContext);
                SalesOrdform.addSubmitButton({ label: "Submit" });
                SalesOrdform.addResetButton({ label: 'Reset' });
                scriptContext.response.writePage(SalesOrdform);
            } catch (error) {
                log.error("Error in onRequest", error);
                scriptContext.response.write("An error occurred while loading the page. Please contact your administrator.");
            }
        };

        /**
         * Creates the main form structure.
         * @returns {serverWidget.Form} - NetSuite form object
         */
        const createForm = () => {
            try {
                let SalesOrdform = serverWidget.createForm({
                    title: "Sales Orders to Fulfill or Bill",
                });

                SalesOrdform.clientScriptFileId = 600;

                let OpenStatus = SalesOrdform.addField({
                    type: serverWidget.FieldType.SELECT,
                    id: "custpage_statuses",
                    label: "Status",
                });
                OpenStatus.addSelectOption({
                    value: "",
                    text: "",
                });
                OpenStatus.addSelectOption({
                    value: "SalesOrd:B",
                    text: "Pending Fulfillment",
                });
                OpenStatus.addSelectOption({
                    value: "SalesOrd:D",
                    text: "Partially Fulfilled",
                });
                OpenStatus.addSelectOption({
                    value: "SalesOrd:E",
                    text: "Pending Billing/Partially Fulfilled",
                });
                OpenStatus.addSelectOption({
                    value: "SalesOrd:F",
                    text: "Pending Billing",
                });

                SalesOrdform.addField({
                    type: serverWidget.FieldType.SELECT,
                    id: "custpage_subsidiary1",
                    label: "Subsidiary",
                    source: "subsidiary",
                });

                SalesOrdform.addField({
                    type: serverWidget.FieldType.SELECT,
                    id: "custpage_customers",
                    label: "Customer",
                    source: "customer",
                });

                SalesOrdform.addField({
                    type: serverWidget.FieldType.SELECT,
                    id: "custpage_department1",
                    label: "Department",
                    source: "department",
                });

                let sublist = SalesOrdform.addSublist({
                    id: "custpage_sublistid",
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: "Sales orders that need to be fulfilled or billed",
                });

                sublist.addField({
                    id: "custpage_internal_id",
                    type: serverWidget.FieldType.TEXT,
                    label: "Internal ID",
                });
                sublist.addField({
                    id: "custpage_document_number",
                    type: serverWidget.FieldType.TEXT,
                    label: "Document Number",
                });
                sublist.addField({
                    id: "custpage_date",
                    type: serverWidget.FieldType.TEXT,
                    label: "Date",
                });
                sublist.addField({
                    id: "custpage_status",
                    type: serverWidget.FieldType.TEXT,
                    label: "Status",
                });
                sublist.addField({
                    id: "custpage_customer_name",
                    type: serverWidget.FieldType.TEXT,
                    label: "Customer Name",
                });
                sublist.addField({
                    id: "custpage_subsidiary",
                    type: serverWidget.FieldType.TEXT,
                    label: "Subsidiary",
                });
                sublist.addField({
                    id: "custpage_department",
                    type: serverWidget.FieldType.TEXT,
                    label: "Department",
                });
                sublist.addField({
                    id: "custpage_class",
                    type: serverWidget.FieldType.TEXT,
                    label: "Class",
                });
                sublist.addField({
                    id: "custpage_subtotal",
                    type: serverWidget.FieldType.TEXT,
                    label: "Subtotal",
                });
                sublist.addField({
                    id: "custpage_tax",
                    type: serverWidget.FieldType.TEXT,
                    label: "Tax",
                });
                sublist.addField({
                    id: "custpage_total",
                    type: serverWidget.FieldType.TEXT,
                    label: "Total",
                });

                return SalesOrdform;

            } catch (error) {
                log.error("Error creating form", error);
                return null;
            }
        };

        /**
         * Applies default values to the form fields based on request parameters.
         * @param {serverWidget.Form} form - NetSuite form object
         * @param {Object} scriptContext - Suitelet request context
         */
        const applyDefaultValues = (SalesOrdform, scriptContext) => {
            try {
                let params = scriptContext.request.parameters;

                let statusField = SalesOrdform.getField({ id: "custpage_statuses" });
                if (statusField) statusField.defaultValue = params.cust_status || "";

                let subsidiaryField = SalesOrdform.getField({ id: "custpage_subsidiary1" });
                if (subsidiaryField) subsidiaryField.defaultValue = params.cust_subsidiary || "";

                let customerField = SalesOrdform.getField({ id: "custpage_customers" });
                if (customerField) customerField.defaultValue = params.cust_customer || "";

                let departmentField = SalesOrdform.getField({ id: "custpage_department1" });
                if (departmentField) departmentField.defaultValue = params.cust_department || "";

            } catch (error) {
                log.error("Error applying default values", error);
            }
        };

        /**
         * Populates the sublist with search results based on filters.
         * @param {serverWidget.Form} form - NetSuite form object
         * @param {Object} scriptContext - Suitelet request context
         */
        const populateSublist = (SalesOrdform, scriptContext) => {
            try {
                let params = scriptContext.request.parameters;
                let filter = [
                    ["mainline", "is", "F"],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["shipping", "is", "F"],
                    "AND",
                    ["cogs", "is", "F"],
                    "AND",
                    ["item.type", "noneof", "Discount"]
                ];

                if (params.cust_status) {
                    filter.push("AND", ["status", "anyof", params.cust_status]);
                }
                if (params.cust_customer) {
                    filter.push("AND", ["customermain.internalid", "anyof", params.cust_customer]);
                }
                if (params.cust_subsidiary) {
                    filter.push("AND", ["subsidiary", "anyof", params.cust_subsidiary]);
                }
                if (params.cust_department) {
                    filter.push("AND", ["department", "anyof", params.cust_department]);
                }

                let searchResults = executeSalesOrderSearch(filter);
                let sublist = SalesOrdform.getSublist({ id: "custpage_sublistid" });
                if (sublist && searchResults) {
                    populateSublistWithData(sublist, searchResults);
                }
            } catch (error) {
                log.error("Error populating sublist", error);
            }
        };

        /**
         * Executes a saved search for sales orders based on filters.
         * @param {Array} filter - Search filter criteria
         * @returns {Array} - Search results
         */
        const executeSalesOrderSearch = (filter) => {
            try {
                let searchObj = search.create({
                    title: "Sales Orders to Fulfill or Bill JJ",
                    id: "customsearch_jj_salesord_to_fulfill",
                    type: "salesorder",
                    filters: filter,
                    columns: [
                        search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                        search.createColumn({ name: "tranid", summary: "GROUP", label: "Document Number" }),
                        search.createColumn({ name: "trandate", summary: "GROUP", label: "Date" }),
                        search.createColumn({ name: "statusref", summary: "GROUP", label: "Status" }),
                        search.createColumn({ name: "entityid", summary: "GROUP", join: "customerMain", label: "Customer Name" }),
                        search.createColumn({ name: "subsidiary", summary: "GROUP", label: "Subsidiary" }),
                        search.createColumn({ name: "department", summary: "GROUP", label: "Department" }),
                        search.createColumn({ name: "class", summary: "GROUP", label: "Class" }),
                        search.createColumn({ name: "netamount", summary: "MAX", label: "Net Amount" }),
                        search.createColumn({ name: "taxtotal", summary: "MAX", label: "Tax Total" }),
                        search.createColumn({ name: "total", summary: "MAX", label: "Total" })
                    ],
                });

                return searchObj.run().getRange({ start: 0, end: 1000 });

            } catch (error) {
                log.error("Error executing sales order search", error);
                return [];
            }
        };

        /**
         * Populates the sublist with retrieved search results.
         * @param {serverWidget.Sublist} sublist - Sublist object
         * @param {Array} searchResults - Array of search result objects
         */
        const populateSublistWithData = (sublist, searchResults) => {
            try {
                searchResults.forEach((result, index) => {
                    sublist.setSublistValue({
                        id: "custpage_internal_id",
                        line: index,
                        value: result.getValue({ name: "internalid", summary: "GROUP" }) || "No Value"
                    });
                    sublist.setSublistValue({
                        id: "custpage_document_number",
                        line: index,
                        value: result.getValue({ name: "tranid", summary: "GROUP" }) || "No Value"
                    });
                    sublist.setSublistValue({
                        id: "custpage_date",
                        line: index,
                        value: result.getValue({ name: "trandate", summary: "GROUP" }) || "No Value"
                    });
                    sublist.setSublistValue({
                        id: "custpage_status",
                        line: index,
                        value: result.getText({ name: "statusref", summary: "GROUP" }) || "No Value"
                    });
                    sublist.setSublistValue({
                        id: "custpage_customer_name",
                        line: index,
                        value: result.getValue({ name: "entityid", summary: "GROUP", join: "customerMain" }) || "No Value"
                    });
                    sublist.setSublistValue({
                        id: "custpage_subsidiary",
                        line: index,
                        value: result.getText({ name: "subsidiary", summary: "GROUP" }) || "No Value"
                    });
                    sublist.setSublistValue({
                        id: "custpage_department",
                        line: index,
                        value: result.getText({ name: "department", summary: "GROUP" }) || "No Value"
                    });
                    sublist.setSublistValue({
                        id: "custpage_class",
                        line: index,
                        value: result.getText({ name: "class", summary: "GROUP" }) || "No Value"
                    });
                    sublist.setSublistValue({
                        id: "custpage_subtotal",
                        line: index,
                        value: result.getValue({ name: "netamount", summary: "MAX" }) || "0.00"
                    });
                    sublist.setSublistValue({
                        id: "custpage_tax",
                        line: index,
                        value: result.getValue({ name: "taxtotal", summary: "MAX" }) || "0.00"
                    });
                    sublist.setSublistValue({
                        id: "custpage_total",
                        line: index,
                        value: result.getValue({ name: "total", summary: "MAX" }) || "0.00"
                    });
                });
            } catch (error) {
                log.error("Error populating sublist with data", error);
            }
        };

        return { onRequest };
    });