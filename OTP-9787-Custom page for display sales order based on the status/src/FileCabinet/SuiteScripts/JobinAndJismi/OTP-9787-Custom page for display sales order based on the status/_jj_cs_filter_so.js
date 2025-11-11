/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/************************************************************************************************ 
*
* OTP-9787: Custom page for displaying sales orders based on status
*
**************************************************************************************************
*
* Author: Jobin and Jismi IT Services
*
* Date Created: 30-October-2025
*
* Description: This script redirects to a Suitelet that displays sales orders requiring 
* fulfillment or billing. It passes filter values (Status, Subsidiary, Customer, Department) 
* as parameters to the Suitelet.
*
* REVISION HISTORY
*
* @version 1.0 30-October-2025 : Created the initial build by JJ0417
**************************************************************************************************/

define(['N/record', 'N/url', 'N/currentRecord', 'N/log'],
    /**
     * @param {record} record
     * @param {url} url
     * @param {currentRecord} currentRecord
     * @param {log} log
     */
    function (record, url, currentRecord, log) {

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return false to prevent native save and redirect
         */
        function saveRecord(scriptContext) {
            try {
                let curRecord = scriptContext.currentRecord;
                let suiteletUrl = generateSuiteletUrl(curRecord);
                navigateToSuitelet(suiteletUrl);
                return false; 
            } catch (error) {
                log.error("Error in saveRecord", error);
                return false;
            }
        }

        /**
         * Generates the Suitelet URL with selected filter parameters.
         *
         * @param {Record} curRecord - Current form record
         * @returns {string} - Resolved Suitelet URL
         */
        function generateSuiteletUrl(curRecord) {
            try {
                return url.resolveScript({
                    scriptId: 'customscript_jj_sl_so_by_status',
                    deploymentId: 'customdeploy_jj_sl_so_by_status',
                    params: {
                        cust_subsidiary: curRecord.getValue('custpage_subsidiary1'),
                        cust_customer: curRecord.getValue('custpage_customers'),
                        cust_status: curRecord.getValue('custpage_statuses'),
                        cust_department: curRecord.getValue('custpage_department1')
                    }
                });
            } catch (error) {
                log.error("Error generating Suitelet URL", error);
                return '';
            }
        }

        /**
         * Redirects the browser to the Suitelet URL.
         *
         * @param {string} suiteletUrl - URL to navigate to
         */
        function navigateToSuitelet(suiteletUrl) {
            try {
                window.onbeforeunload = null;
                window.location.href = suiteletUrl;
            } catch (error) {
                log.error("Error navigating to Suitelet", error);
            }
        }

        return {
            saveRecord: saveRecord
        };
    });
