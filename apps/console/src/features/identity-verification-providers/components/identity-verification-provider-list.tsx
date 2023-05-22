/**
 * Copyright (c) 2023, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
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

import { AccessControlConstants, Show } from "@wso2is/access-control";
import { hasRequiredScopes } from "@wso2is/core/helpers";
import { IdentifiableComponentInterface, LoadableComponentInterface } from "@wso2is/core/models";
import {
    AnimatedAvatar,
    AppAvatar,
    ConfirmationModal,
    DataTable,
    EmptyPlaceholder,
    LinkButton,
    PrimaryButton,
    TableActionsInterface,
    TableColumnInterface
} from "@wso2is/react-components";
import { AxiosError } from "axios";
import React, { FunctionComponent, ReactElement, ReactNode, SyntheticEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Header, Icon, SemanticICONS } from "semantic-ui-react";
import {
    AppConstants,
    AppState,
    FeatureConfigInterface,
    UIConstants,
    getEmptyPlaceholderIllustrations,
    history
} from "../../core";
import { deleteIDVP } from "../api";
import {
    IDVPListResponseInterface,
    IdentityVerificationProviderInterface, IDVPTemplateItemInterface
} from "../models";
import { handleIDVPDeleteError, handleIDVPDeleteSuccess } from "../utils";

/**
 * Proptypes for the identity verification provider list component.
 */
interface IdentityVerificationProviderListPropsInterface extends LoadableComponentInterface,
    IdentifiableComponentInterface {
    /**
     * Identity verification providers list.
     */
    idvpList: IDVPListResponseInterface;
    idvpTemplateTypeList: IDVPTemplateItemInterface[];
    /**
     * Advanced Search component.
     */
    advancedSearch?: ReactNode;
    /**
     * Default list item limit.
     */
    defaultListItemLimit?: number;
    /**
     * Callback to be fired when clicked on the empty list placeholder action.
     */
    onEmptyListPlaceholderActionClick?: () => void;
    /**
     * On Identity verification provider delete callback.
     */
    onIdentityVerificationProviderDelete?: () => void;
    /**
     * On list item select callback.
     * @param event - Click event.
     * @param idvp - Selected IDVP
     */
    onListItemClick?: (event: SyntheticEvent, idvp: IdentityVerificationProviderInterface) => void;
    /**
     * Callback for the search query clear action.
     */
    onSearchQueryClear?: () => void;
    /**
     * Search query for the list.
     */
    searchQuery?: string;
    /**
     * Enable selection styles.
     */
    selection?: boolean;
    /**
     * Show list item actions.
     */
    showListItemActions?: boolean;
}

/**
 * Identity verification provider list component.
 *
 * @param props - Props injected to the component.
 * @returns Identity Verification Provider List component.
 */
export const IdentityVerificationProviderList: FunctionComponent<IdentityVerificationProviderListPropsInterface> = (
    props: IdentityVerificationProviderListPropsInterface
): ReactElement => {

    const {
        defaultListItemLimit,
        isLoading,
        idvpList,
        idvpTemplateTypeList,
        onEmptyListPlaceholderActionClick,
        onIdentityVerificationProviderDelete,
        onListItemClick,
        onSearchQueryClear,
        searchQuery,
        selection,
        showListItemActions,
        ["data-componentid"]: componentId
    } = props;

    const [ showDeleteConfirmationModal, setShowDeleteConfirmationModal ] = useState<boolean>(false);
    const [ selectedIdvpToBeDeleted, setSelectedIdvpToBeDeleted ] =
        useState<IdentityVerificationProviderInterface>(undefined);
    const [ loading, setLoading ] = useState(false);
    // const [ isAppsLoading, setIsAppsLoading ] = useState(true);

    const { t } = useTranslation();

    const featureConfig: FeatureConfigInterface = useSelector((state: AppState) => state.config.ui.features);
    const allowedScopes: string = useSelector((state: AppState) => state?.auth?.allowedScopes);

    /**
     * Redirects to the identity verification provider edit page when the edit button is clicked.
     *
     * @param idvpId - Identity verification provider id.
     */
    const handleIdentityVerificationProviderEdit = (idvpId: string): void => {
        history.push(AppConstants.getPaths().get("IDVP_EDIT").replace(":id", idvpId));
    };

    /**
     * Shows a confirmation modal when the delete identity verification provider button is clicked.
     *
     * @param idvpId - Identity verification provider id.
     */
    const showIDVPDeleteConfirmationModal = (idvpId: string): void => {
        const selectedIDVP: IdentityVerificationProviderInterface = idvpList.identityVerificationProviders
            .find((idvp: IdentityVerificationProviderInterface) => idvp.id === idvpId);

        setSelectedIdvpToBeDeleted(selectedIDVP);
        setShowDeleteConfirmationModal(true);
    };

    /**
     * Deletes an identity verification provider when the confirmation button clicked on the delete confirmation modal.
     *
     * @param idvpId - Identity verification provider id.
     */
    const handleIdvpDeletion = (idvpId: string): void => {

        setLoading(true);
        deleteIDVP(idvpId)
            .then(handleIDVPDeleteSuccess)
            .catch((error: AxiosError) => {
                handleIDVPDeleteError(error);
            })
            .finally(() => {
                setLoading(false);
                setShowDeleteConfirmationModal(false);
                setSelectedIdvpToBeDeleted(undefined);
                onIdentityVerificationProviderDelete();
            });
    };

    /**
     * Resolve the relevant placeholder.
     *
     * @returns Placeholder.
     */
    const showPlaceholders = (): ReactElement => {
        // When the search returns empty.
        if (searchQuery) {
            return (
                <EmptyPlaceholder
                    action={ (
                        <LinkButton onClick={ onSearchQueryClear }>Clear search query</LinkButton>
                    ) }
                    image={ getEmptyPlaceholderIllustrations().emptySearch }
                    imageSize="tiny"
                    title={ t("console:develop.features.idp.placeHolders.emptyIDPSearchResults.title") }
                    subtitle={ [
                        t("console:develop.features.idp.placeHolders.emptyIDPSearchResults.subtitles.0",
                            { searchQuery: searchQuery }),
                        t("console:develop.features.idp.placeHolders.emptyIDPSearchResults.subtitles.1")
                    ] }
                    data-testid={ `${ componentId }-empty-search-placeholder` }
                />
            );
        }

        if (idvpList?.totalResults === 0) {
            return (
                <EmptyPlaceholder
                    className="list-placeholder"
                    action={ onEmptyListPlaceholderActionClick && (
                        // TODO: Change this to IDVP Write
                        <Show when={ AccessControlConstants.IDP_WRITE }>
                            <PrimaryButton
                                onClick={ onEmptyListPlaceholderActionClick }
                            >
                                <Icon name="add"/>
                                { t("console:develop.features.idvp.buttons.addIDVP") }
                            </PrimaryButton>
                        </Show>
                    ) }
                    image={ getEmptyPlaceholderIllustrations().newList }
                    imageSize="tiny"
                    subtitle={ [
                        t("console:develop.features.idvp.placeholders.emptyIDVPList.subtitles.0")
                    ] }
                    data-testid={ `${ componentId }-empty-placeholder` }
                />
            );
        }

        return null;
    };

    /**
     * Resolves data table columns.
     *
     * @returns Data Table Columns.
     */
    const resolveTableColumns = (): TableColumnInterface[] => {
        return [
            {
                allowToggleVisibility: false,
                dataIndex: "name",
                id: "name",
                key: "name",
                render: (idvp: IdentityVerificationProviderInterface): ReactNode => {
                    const templateType: IDVPTemplateItemInterface= idvpTemplateTypeList?.find(
                        (template:IDVPTemplateItemInterface) => template.id === idvp.Type
                    );

                    return (
                        <Header
                            image
                            as="h6"
                            className="header-with-icon"
                            data-testid={ `${ componentId }-item-heading` }
                        >
                            {
                                templateType?.image
                                    ? (
                                        <AppAvatar
                                            size="mini"
                                            name={ idvp.Name }
                                            image={ templateType.image }
                                            spaced="right"
                                            data-testid={ `${ componentId }-item-image` }
                                        />
                                    )
                                    : (
                                        <AppAvatar
                                            image={ (
                                                <AnimatedAvatar
                                                    name={ idvp.Name }
                                                    size="mini"
                                                    data-testid={ `${componentId}-item-image-inner` }
                                                />
                                            ) }
                                            size="mini"
                                            spaced="right"
                                            data-testid={ `${componentId}-item-image` }
                                        />
                                    )
                            }
                            <Header.Content>
                                { idvp.Name }
                                <Header.Subheader data-testid={ `${componentId}-item-sub-heading` }>
                                    { idvp.description }
                                </Header.Subheader>
                            </Header.Content>
                        </Header>
                    );
                },
                title: t("console:develop.features.idp.list.name")
            },
            {
                allowToggleVisibility: false,
                dataIndex: "action",
                id: "actions",
                key: "actions",
                textAlign: "right",
                title: t("console:develop.features.idp.list.actions")
            }
        ];
    };

    /**
     * Resolves data table actions.
     *
     * @returns Data Table Actions.
     */
    const resolveTableActions = (): TableActionsInterface[] => {
        if (!showListItemActions) {
            return;
        }

        return [
            {
                "data-componentid": `${ componentId }-item-edit-button`,
                hidden: (): boolean => false,
                icon: (): SemanticICONS =>
                    hasRequiredScopes(featureConfig?.identityProviders,
                        featureConfig?.identityProviders?.scopes?.update, allowedScopes) ? "pencil alternate" : "eye",
                onClick: (e: SyntheticEvent, idvp: IdentityVerificationProviderInterface): void =>
                    handleIdentityVerificationProviderEdit(idvp.id),
                popupText: (): string =>
                    hasRequiredScopes(featureConfig?.identityProviders,
                        featureConfig?.identityProviders?.scopes?.update, allowedScopes)
                        ? t("common:edit")
                        : t("common:view"),
                renderer: "semantic-icon"
            },
            {
                "data-componentid": `${ componentId }-item-delete-button`,
                hidden: (): boolean => !hasRequiredScopes(featureConfig?.identityProviders,
                    featureConfig?.identityProviders?.scopes?.delete, allowedScopes),
                icon: (): SemanticICONS => "trash alternate",
                onClick: (e: SyntheticEvent, idvp: IdentityVerificationProviderInterface): void =>
                    showIDVPDeleteConfirmationModal(idvp.id),
                popupText: (): string => t("common:delete"),
                renderer: "semantic-icon"
            }
        ];
    };

    const getIdvpDeleteConfirmationModal = () => {
        return (
            <ConfirmationModal
                primaryActionLoading={ loading }
                onClose={ (): void => setShowDeleteConfirmationModal(false) }
                type="negative"
                open={ showDeleteConfirmationModal }
                assertion={ selectedIdvpToBeDeleted?.Name }
                assertionHint={ t("console:develop.features.idvp.confirmations.deleteIDVP.assertionHint") }
                assertionType="checkbox"
                primaryAction={ t("common:confirm") }
                secondaryAction={ t("common:cancel") }
                onSecondaryActionClick={ (): void => setShowDeleteConfirmationModal(false) }
                onPrimaryActionClick={ (): void => handleIdvpDeletion(selectedIdvpToBeDeleted.id) }
                data-componentid={ `${ componentId }-delete-confirmation-modal` }
                closeOnDimmerClick={ false }
            >
                <ConfirmationModal.Header data-componentid={ `${ componentId }-delete-confirmation-modal-header` }>
                    { t("console:develop.features.idvp.confirmations.deleteIDVP.header") }
                </ConfirmationModal.Header>
                <ConfirmationModal.Message
                    attached
                    negative
                    data-componentid={ `${ componentId }-delete-confirmation-modal-message` }
                >
                    { t("console:develop.features.idvp.confirmations.deleteIDVP.message") }
                </ConfirmationModal.Message>
                <ConfirmationModal.Content data-componentid={ `${ componentId }-delete-confirmation-modal-content` }>
                    { t("console:develop.features.idvp.confirmations.deleteIDVP.content") }
                </ConfirmationModal.Content>
            </ConfirmationModal>
        );
    };


    return (
        <>
            <DataTable<IdentityVerificationProviderInterface>
                className="identity-providers-table"
                isLoading={ isLoading }
                loadingStateOptions={ {
                    count: defaultListItemLimit ?? UIConstants.DEFAULT_RESOURCE_LIST_ITEM_LIMIT,
                    imageType: "square"
                } }
                actions={ resolveTableActions() }
                columns={ resolveTableColumns() }
                data={ idvpList?.identityVerificationProviders }
                onRowClick={ (e: SyntheticEvent, idvp: IdentityVerificationProviderInterface): void => {
                    handleIdentityVerificationProviderEdit(idvp.id);
                    onListItemClick && onListItemClick(e, idvp);
                } }
                placeholders={ showPlaceholders() }
                selectable={ selection }
                showHeader={ false }
                transparent={ !isLoading && (showPlaceholders() !== null) }
                data-testid={ componentId }
            />
            { selectedIdvpToBeDeleted && getIdvpDeleteConfirmationModal() }
        </>
    );
};

/**
 * Default proptypes for the Identity verification provider list.
 */
IdentityVerificationProviderList.defaultProps = {
    "data-componentid": "idvp-list",
    selection: true,
    showListItemActions: true
};
