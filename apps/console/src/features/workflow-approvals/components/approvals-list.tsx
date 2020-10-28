/**
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, {
    FunctionComponent,
    ReactElement,
    ReactNode,
    SyntheticEvent,
    useEffect,
    useState
} from "react";
import { useTranslation } from "react-i18next";
import { Header, Label, SemanticCOLORS, SemanticICONS } from "semantic-ui-react";
import { ApprovalStatus, ApprovalTaskDetails, ApprovalTaskListItemInterface } from "../models";
import { UIConstants } from "../../core/constants";
import {
    DataTable,
    EmptyPlaceholder,
    TableActionsInterface,
    TableColumnInterface,
    LinkButton
} from "@wso2is/react-components";
import { FeatureConfigInterface } from "../../core/models";
import {
    AlertLevels,
    LoadableComponentInterface,
    SBACInterface,
    TestableComponentInterface
} from "@wso2is/core/models";
import { EmptyPlaceholderIllustrations } from "../../core/configs";
import { fetchPendingApprovalDetails } from "../api";
import { useDispatch } from "react-redux";
import { addAlert } from "@wso2is/core/store";
import { ApprovalTaskComponent } from "./approval-task";

/**
 * Prop types for the approvals list component.
 */
interface ApprovalsListPropsInterface extends SBACInterface<FeatureConfigInterface>, LoadableComponentInterface,
    TestableComponentInterface {

    /**
     * Resolve the label color of the task.
     *
     * @param status
     */
    resolveApprovalTagColor?: (
        status: ApprovalStatus.READY | ApprovalStatus.RESERVED | ApprovalStatus.COMPLETED
    ) => SemanticCOLORS;
    /**
     * Handles updating the status of the task.
     *
     * @param id
     * @param status
     */
    updateApprovalStatus?: (
        id: string,
        status: ApprovalStatus.CLAIM | ApprovalStatus.RELEASE | ApprovalStatus.APPROVE | ApprovalStatus.REJECT
    ) => void;
    /**
     * Default list item limit.
     */
    defaultListItemLimit?: number;
    /**
     * Application list.
     */
    list: ApprovalTaskListItemInterface[];
    /**
     * Callback to be fired when clicked on the empty list placeholder action.
     */
    onEmptyListPlaceholderActionClick?: () => void;
    /**
     * Enable selection styles.
     */
    selection?: boolean;
    /**
     * Show list item actions.
     */
    showListItemActions?: boolean;
    /**
     * Search query string
     */
    searchResult?: number;
    /**
     * Fetch approvals list
     */
    getApprovalsList?: () => void;
    /**
     * Approval status filter.
     */
    filterStatus?: string;
    /**
     * Handle the change of filter status.
     */
    onChangeStatusFilter?: (status: string) => void;
}

/**
 * Approvals list component.
 *
 * @param {ApprovalsListPropsInterface} props - Props injected to the approvals list component.
 * @return {JSX.Element}]
 */
export const ApprovalsList: FunctionComponent<ApprovalsListPropsInterface> = (
    props: ApprovalsListPropsInterface
): JSX.Element => {

    const { t } = useTranslation();

    const dispatch = useDispatch();

    const {
        getApprovalsList,
        onChangeStatusFilter,
        resolveApprovalTagColor,
        updateApprovalStatus,
        defaultListItemLimit,
        filterStatus,
        isLoading,
        list,
        selection,
        searchResult,
        showListItemActions,
        [ "data-testid" ]: testId
    } = props;

    const [ isApprovalTaskDetailsLoading, setApprovalTaskDetailsLoading ] = useState<boolean>(false);
    const [ approval, setApproval ] = useState<ApprovalTaskDetails>(undefined);
    const [ openApprovalTaskModal, setOpenApprovalTaskModal ] = useState<boolean>(false);

    useEffect(() => {
        if (approval === undefined) {
            return;
        }

        setOpenApprovalTaskModal(true);
    }, [ approval ]);

    const getApprovalTaskDetails = (approval: ApprovalTaskListItemInterface): void => {
        setApprovalTaskDetailsLoading(true);

        fetchPendingApprovalDetails(approval.id)
            .then((response) => {
                let selectedApprovalTask = response;
                selectedApprovalTask = {
                    ...selectedApprovalTask,
                    taskStatus: approval?.status,
                    createdTimeInMillis: approval.createdTimeInMillis
                };
                setApproval(selectedApprovalTask);
            })
            .catch((error) => {
                if (error.response && error.response.data && error.response.data.description) {
                    dispatch(addAlert({
                        description: error.response.data.description,
                        level: AlertLevels.ERROR,
                        message: t("adminPortal:components.approvals.notifications.fetchApprovalDetails." +
                            "error.message")
                    }));

                    return;
                }

                dispatch(addAlert({
                    description: t("adminPortal:components.approvals.notifications.fetchApprovalDetails" +
                        ".genericError.description"),
                    level: AlertLevels.ERROR,
                    message: t("adminPortal:components.approvals.notifications.fetchApprovalDetails." +
                        "genericError.message")
                }));
            })
            .finally(() => {
                setApprovalTaskDetailsLoading(false);
            });
    };

    /**
     * Handler for the approval detail button click.
     *
     * @param approval
     */
    const handleApprovalDetailClick = (approval: ApprovalTaskListItemInterface): void => {
        getApprovalTaskDetails(approval);
    };

    /**
     * Resolve the relevant placeholder.
     *
     * @return {React.ReactElement}
     */
    const showPlaceholders = (): ReactElement => {
        if (searchResult === 0) {
            return (
                <EmptyPlaceholder
                    action={ (
                        <LinkButton onClick={ getApprovalsList }>
                            { t("adminPortal:components.approvals.placeholders.emptySearchResults.action") }
                        </LinkButton>
                    ) }
                    image={ EmptyPlaceholderIllustrations.emptySearch }
                    imageSize="tiny"
                    title={ t("adminPortal:components.approvals.placeholders.emptySearchResults.title") }
                    subtitle={ [
                        t("adminPortal:components.approvals.placeholders.emptySearchResults.subtitles.0"),
                        t("adminPortal:components.approvals.placeholders.emptySearchResults.subtitles.1"),
                        t("adminPortal:components.approvals.placeholders.emptyApprovalFilter.subtitles.2")
                    ] }
                    data-testid={ `${ testId }-empty-search-placeholder` }
                />
            );
        }

        if (list?.length === 0 && filterStatus !== ApprovalStatus.ALL) {
            return (
                <EmptyPlaceholder
                    action={ (
                        <LinkButton onClick={ () => onChangeStatusFilter(ApprovalStatus.ALL) }>
                            { t("adminPortal:components.approvals.placeholders.emptySearchResults.action") }
                        </LinkButton>
                    ) }
                    image={ EmptyPlaceholderIllustrations.newList }
                    imageSize="tiny"
                    title={ t("adminPortal:components.approvals.placeholders.emptyApprovalFilter.title") }
                    subtitle={ [
                        t("adminPortal:components.approvals.placeholders.emptyApprovalFilter.subtitles.0",
                            { status: filterStatus }),
                        t("adminPortal:components.approvals.placeholders.emptyApprovalFilter.subtitles.1",
                            { status: filterStatus }),
                        t("adminPortal:components.approvals.placeholders.emptyApprovalFilter.subtitles.2")
                    ] }
                    data-testid={ `${ testId }-empty-placeholder` }
                />
            );
        }

        if (list?.length === 0) {
            return (
                <EmptyPlaceholder
                    image={ EmptyPlaceholderIllustrations.newList }
                    imageSize="tiny"
                    title={ t("adminPortal:components.approvals.placeholders.emptyApprovalList.title") }
                    subtitle={ [
                        t("adminPortal:components.approvals.placeholders.emptyApprovalList.subtitles.0"),
                        t("adminPortal:components.approvals.placeholders.emptyApprovalList.subtitles.1"),
                        t("adminPortal:components.approvals.placeholders.emptyApprovalList.subtitles.2")
                    ] }
                    data-testid={ `${ testId }-empty-placeholder` }
                />
            );
        }

        return null;
    };

    /**
     * Resolves data table actions.
     *
     * @return {TableActionsInterface[]}
     */
    const resolveTableActions = (): TableActionsInterface[] => {
        if (!showListItemActions) {
            return;
        }

        return [
            {
                "data-testid": `${ testId }-item-approve-button`,
                hidden: (approval: ApprovalTaskListItemInterface): boolean =>
                    approval?.status === ApprovalStatus.COMPLETED,
                icon: (): SemanticICONS => "check",
                onClick: (e: SyntheticEvent, approval: ApprovalTaskListItemInterface): void =>
                    updateApprovalStatus(approval?.id, ApprovalStatus.APPROVE),
                popupText: (): string => t("common:approve"),
                renderer: "semantic-icon"
            },
            {
                "data-testid": `${ testId }-item-reject-button`,
                hidden: (approval: ApprovalTaskListItemInterface): boolean =>
                    approval?.status === ApprovalStatus.COMPLETED,
                icon: (): SemanticICONS => "times",
                onClick: (e: SyntheticEvent, approval: ApprovalTaskListItemInterface): void =>
                    updateApprovalStatus(approval?.id, ApprovalStatus.REJECT),
                popupText: (): string => t("common:reject"),
                renderer: "semantic-icon"
            },
            {
                "data-testid": `${ testId }-item-claim-button`,
                hidden: (approval: ApprovalTaskListItemInterface): boolean =>
                    approval?.status === ApprovalStatus.COMPLETED || approval?.status === ApprovalStatus.RESERVED,
                icon: (): SemanticICONS => "pin",
                onClick: (e: SyntheticEvent, approval: ApprovalTaskListItemInterface): void =>
                    updateApprovalStatus(approval?.id, ApprovalStatus.CLAIM),
                popupText: (): string => t("common:claim"),
                renderer: "semantic-icon"
            },
            {
                "data-testid": `${ testId }-item-release-button`,
                hidden: (approval: ApprovalTaskListItemInterface): boolean =>
                    approval?.status === ApprovalStatus.COMPLETED|| approval?.status === ApprovalStatus.READY,
                icon: (): SemanticICONS => "paper plane",
                onClick: (e: SyntheticEvent, approval: ApprovalTaskListItemInterface): void =>
                    updateApprovalStatus(approval?.id, ApprovalStatus.RELEASE),
                popupText: (): string => t("common:release"),
                renderer: "semantic-icon"
            }
        ];

    };


    /**
     * Resolves data table columns.
     *
     * @return {TableColumnInterface[]}
     */
    const resolveTableColumns = (): TableColumnInterface[] => {
        return [
            {
                allowToggleVisibility: false,
                dataIndex: "name",
                id: "name",
                key: "name",
                render: (approval: ApprovalTaskListItemInterface): ReactNode => {
                    return (
                        <Header as="h6" image data-testid={ `${ testId }-item-heading` }>
                            <Header.Content>
                                { approval.id + " " + approval.presentationSubject + " " }
                                <Label circular size="tiny">
                                    { approval.presentationName }
                                </Label>
                                <Header.Subheader data-testid={ `${ testId }-item-sub-heading` }>
                                    <div className="pb-2">
                                        <Label
                                            circular
                                            size="mini"
                                            className="micro spaced-right"
                                            color={ resolveApprovalTagColor(approval.status) }
                                        />
                                        { approval.status }
                                    </div>
                                </Header.Subheader>
                            </Header.Content>
                        </Header>
                    );
                },
                title: t("adminPortal:components.approvals.list.columns.name")
            },
            {
                allowToggleVisibility: false,
                dataIndex: "action",
                id: "actions",
                key: "actions",
                textAlign: "right",
                title: t("adminPortal:components.approvals.list.columns.actions")
            }
        ];
    };

    return (
        <>
            <DataTable<ApprovalTaskListItemInterface>
                className="approvals-table"
                externalSearch={ null }
                isLoading={ isLoading || isApprovalTaskDetailsLoading }
                loadingStateOptions={ {
                    count: defaultListItemLimit ?? UIConstants.DEFAULT_RESOURCE_LIST_ITEM_LIMIT,
                    imageType: "square"
                } }
                actions={ resolveTableActions() }
                columns={ resolveTableColumns() }
                data={ list }
                onRowClick={ (e: SyntheticEvent, approval: ApprovalTaskListItemInterface): void => {
                    handleApprovalDetailClick(approval);
                } }
                placeholders={ showPlaceholders() }
                selectable={ selection }
                showHeader={ false }
                transparent={ !(isLoading || isApprovalTaskDetailsLoading) && (showPlaceholders() !== null) }
                data-testid={ testId }
            />
            <ApprovalTaskComponent
                resolveApprovalTagColor={ resolveApprovalTagColor }
                onCloseApprovalTaskModal={ () => setOpenApprovalTaskModal(false) }
                openApprovalTaskModal={ openApprovalTaskModal }
                approval={ approval }
                updateApprovalStatus={ updateApprovalStatus }
            />
        </>
    );
};

/**
 * Default props for the component.
 */
ApprovalsList.defaultProps = {
    "data-testid": "approvals-list",
    selection: true,
    showListItemActions: true
};
