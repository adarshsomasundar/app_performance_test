var product_controller = function ($scope, $rootScope, $compile, $sce, $filter, util, $location, $timeout,
                                   $route, $routeParams, product_product_service,
                                   product_attribute_value_service, pricing_sales_price_type_service, product_uom_service,
                                   pricing_product_price_group_service, supplier_supplier_service,
                                   product_pop_code_service, product_category_service,
                                   $mdSidenav, organization_tax_code_service, organization_branch_service,
                                   product_tags_lookup_service, product_category_hierarchical_service,
                                   product_matrix_dimension_service, sub_system_preview_service,tax_code_value_mapper_index_service,
                                   product_choices_service, labels_config_service, shrinkage_reasons_service,
                                   StdDialog, $mdPanel, product_season_service, supplier_supplier_with_all_service,
                                   brand_names_filter_service, model_names_filter_service, calibers_filter_service,
                                   first_firearm_service, image_maintainer, inventory_grid_service, pricing_price_type_value_mapper_index_service,
                                   supplier_value_mapper_index_service, ep_export_service, product_history_service, organization_branch_value_mapper_index_service,
                                   form_view_maintainer_service, session_storage_service, $window, product_uom_value_mapper_index_service,
                                   product_kit_component_service, unsaved_data_tracker, contacts_service, ep_percentageFilter,
                                   ep_currencyFilter, ep_decimalFilter) {

    var vm = this;
    vm.show_intake_batch_detail_layer = false;
    const {getFontIcon} = miscUtils.exports; // Import getFontIcon.
    $scope.getFontIcon = getFontIcon;          // Make getFontIcon available on scope for templates
    vm.serial_number_grid_loaded_flag = false;
    var non_reorderable_column = null;
    var non_reorderable_column_for_review = null;
    vm.wait_for_save = false;
    vm.pre = "";
    var ImageMaintainer = image_maintainer.ImageMaintainer;
    var app_name = "Product";
    var component_name = "ProductOverview";
    var product_types = [0, 4, 7];
    var product_types_pricing = [0, 2, 4, 6];
    vm.upc_added = false;
    vm.component_grid_loaded = false;
    vm.product_data_loaded = false;
    vm.pricing_adjustment = 0;
    const product_kit = 2;
    const product_shipper = 7;
    const product_fee = 6;
    const product_standard = 0;
    const product_firearm = 4;
    const product_membership_fee = 8;
    const product_donation = 9;
    const product_gift_card = 10;
    const prompt_price_tye = 3;
    const default_lot_type = 1;
    const gift_card_manage_funds = 40;

    vm.product_type_kit = 2;
    vm.product_type_shipper = 7;
    vm.deleted_alternate_units = [];
    vm.delete_au_map = {}; //vm.delete_au_map = {storeId: {[record1, record2]}};
    vm.prev_price_by = null;
    vm.init_store_load = false;
    vm.kit_or_shipper = null;

    let pcount = 0;
    vm.can_access = function (petitioner) {
        return util.verify_permission(petitioner);
    };

    const default_tab_index = "1";
    vm.tabs = {
        "general": true,
        "buying": true,
        "stock_sell": true,
        "price_cost": true,
        "history": true,
        "components": false,
        "serial_numbers": false
    };

    const tabs = {
        "1": "general",
        "2": "buying",
        "3": "stock_sell",
        "4": "price_cost",
        "5": "history",
        "6": "components",
        "7": "serial_numbers"
    };

    const component_tab_index = {
        2: '6',
        7: '6'
    };

    vm.update_session_tab_index = function (id = default_tab_index) {
        let selected_tab_details = {
            "app_name": app_name,
            "component_name": component_name,
            "selected_tab_index": id,
            "nav_service": vm.nav_service
        };

        $rootScope.$broadcast('tab_index_updated', selected_tab_details);
    };

    vm.tab_clicked = function (id = default_tab_index, update_session = true) {
        vm.tab_selected_index = angular.copy(id);
        if (vm.has_serial_number_tab_access && id == 7) {
            $scope.$broadcast('serial_number_tab_opened', {});
        }
        if (update_session)
            vm.update_session_tab_index(id);
    };

    vm.is_default_supplier_defined = false;

    vm.ks_grid_datasource = null;
    vm.add_mode = false;
    vm.product = {};
    vm.new_upc_text = {
        is_primary: true,
        alternate_code: null,
        uom_name: "",
        uom: null
    };
    vm.show_add_new_upc_btn = false;
    vm.edit_product_upcs_temp = [];
    // have to null these out as well as use ng-model in the html for the <select
    // see http://docs.telerik.com/kendo-ui/AngularJS/Troubleshooting/common-issues#widgets-with-ng-model-directives-reflect-no-model-value
    vm.product.category = null;
    vm.product.popularity = null;
    vm.product.supplier = null;
    vm.product.price_by = null;
    vm.product.price_group = null;
    vm.product.stocking_uom = null;
    vm.product.selling_uom = null;
    vm.product.buying_uom = null;
    vm.product.product_type = null;
    vm.product.allow_fractional_qty = false;
    vm.product.is_discontinued = false;
    vm.product_specification = '';
    vm.product_upc_count = 0;
    vm.firearm_type = null;
    vm.firearm_manufacturer = null;
    vm.firearm_model = null;
    vm.firearm_caliber_or_gauge = null;
    vm.product.attribute_values = [];
    vm.product_suppliers = [];
    vm.images = [];
    vm.subsystem_data = [];
    vm.product_stocking_uom = null;
    vm.product_stocking_uom_name = '';
    vm.product_selling_uom = null;
    vm.product_selling_uom_name = '';
    vm.product_selling_uom_multiple = null;
    vm.product_purchasing_uom = null;
    vm.product_purchasing_uom_name = '';
    vm.product_purchasing_uom_multiple = null;
    vm.product_order_quantity_multiple = null;
    vm.uom_order_multiple = null;
    vm.new_item = {};
    vm.item = {};
    vm.item.buying = {};
    vm.item.selling = {};
    vm.item.stocking = {};
    // have to null these out as well as use ng-model in the html for the <select
    // see http://docs.telerik.com/kendo-ui/AngularJS/Troubleshooting/common-issues#widgets-with-ng-model-directives-reflect-no-model-value
    vm.item.buying.popularity = null;
    vm.item.buying.supplier = null;
    vm.item.selling.tax_code_id = null;
    vm.item.selling.is_taxable = false;
    vm.item.selling.is_loyalty_active = true;

    vm.item.in_estore = false;
    vm.item.is_returnable = false;
    vm.item.stocking.is_stocked = false;
    vm.item.stocking.track_inventory = false;
    vm.item.selling.prompt_pos_note = false;
    vm.item.selling.is_discountable = false;
    vm.item.season = null;
    vm.item.selling.label_count_type = null;
    vm.item.stocking.season = null;
    vm.item_branch = null;
    vm.item_branch = '';
    vm.item_branch_list = [];
    vm.item_branch_list_count = 0;
    vm.item_purchase_uom = {};
    vm.item_stock_uom = {};
    vm.item_sell_uom = {};
    vm.item_add_to_stores = [];
    vm.item_max_quantity = null;
    vm.item_order_point = null;
    vm.selected_supplier = {};

    vm.current_product_stock_uom = 0;
    vm.current_price_by = null;
    vm.next_supplier_id = -1;

    vm.validating_tag = false;
    vm.selling_price = {};
    vm.selling_price.price_type = null;


    //vm.selling_price.selling_price_uom = null;
    vm.selling_price.amount = 0.00;
    vm.alternate_selling_price = [];
    vm.alternate_deleted_price = [];
    vm.cost = {};
    vm.cost.replacement_cost = 0.00;
    vm.cost.average_cost = 0.00;
    vm.cost.last_cost = 0.00;
    vm.cost.stock_uom = null;
    vm.existing_product_uoms = [];
    vm.existing_purchase_uoms = [];
    vm.existing_sell_uoms = [];
    vm.existing_stock_uoms = [];
    vm.existing_sell_price_uoms = [];
    vm.existing_upc_uoms = [];
    vm.edit_product_kit = [];
    vm.processing_new_item_category_search = false;
    vm.processing_category_search = false;

    vm.kit_add_parent_product = 0;
    vm.kit_add_sku = "";
    vm.kit_add_description = "";
    vm.kit_add_sell_uom_name = "";
    vm.kit_add_quantity = 0;
    vm.kit_add_sell_uom = null;
    vm.current_item_branch = "";

    vm.system_default_price_type = null;
    vm.system_default_price_type_name = "";
    vm.system_default_stocking_uom = null;
    vm.system_default_stocking_uom_name = "";

    vm.checkedIds = [];
    vm.checked_kit_row_count = 0;
    vm.is_item_displayed = false;
    vm.firearm_manufacturers_data = [];
    vm.firearm_models_data = [];
    vm.firearm_caliber_or_gauges_data = [];
    vm.firearm_initialized = false;
    vm.loading_firearm = false;

    vm.product_data_resource = product_product_service.record_resource();
    vm.active_branch = null;
    vm.show_add_to_stores = false;
    vm.carousel_active = 0;
    vm.carousel_interval = -1;
    vm.carousel_noWrapSlides = false;
    vm.carousel_slides = [];
    vm.product_variant_1_attribute = null;
    vm.product_variant_2_attribute = null;
    vm.product_variant_3_attribute = null;
    vm.ctv = "6.99";
    vm.selling_price_label = "Retail Price";
    vm.alternate_selling_price_label = "Alternate Selling Prices";
    vm.selected_category_default = "Select Category";
    vm.history_time_type = 'week';
    vm.item_buying_variant_data = [];
    vm.item_pricing_variant_data = [];
    vm.buying_variant_fields = [];
    vm.buying_variant_field = null;
    vm.pricing_variant_fields = [];
    vm.my_buying_variant_schema = {};
    vm.my_buying_variant_fields = {};
    vm.my_pricing_variant_schema = {};
    vm.my_pricing_variant_fields = {};
    vm.buying_variant_value_disabled = true;
    vm.pricing_variant_value_disabled = true;
    vm.category_search = "";
    vm.category_search_results_shown = false;
    vm.new_item_category_search = "";
    vm.new_item_category_search_results_shown = false;
    vm.selected_category_ancestors = [];
    vm.full_tree_data = {};

    vm.product_choices = {};
    vm.is_new_item_from_component_tab = false;
    vm.call_back_to_child = null;
    vm.item_to_kitshipper = {};
    vm.branch_text_not_found = false;
    vm.price_by_location_price_map = {};
    vm.alternate_price_by_location_map = {};
    vm.alternate_unit_grid_data_source = new kendo.data.DataSource({
        data: []
    });

    vm.has_serial_number_tab_access = false;
    vm.refresh_calculations_when_store_changes = true; //This flag will be sent to fill_product_record, so that it does not call calculate Gp% and price before save, as it is already calculated when grid recorsds changed.

    vm.adjust_inventory = {};
    vm.adjust_inventory.selected_shrinkage = 0;

    /*
    * GP Product code tab-wise
    * */

    const _clear_stock_sell_values = function () {
        var filter = {
            item_id: vm.item.id,
            remove_quantities: true
        };
        vm.item.stocking.track_inventory = false;
        product_product_service.check_track_inventory(vm.product.id, filter).then(function (result) {

            vm.item.stocking.overall_qty_on_hand = result.detail.overall_qty_on_hand;
            vm.item.stocking.overall_qty_available = result.detail.overall_qty_available;
            vm.item.stocking.overall_qty_on_order = result.detail.overall_qty_on_order;
            vm.item.stocking.overall_qty_committed = result.detail.overall_qty_committed;
            vm.item.stocking.overall_qty_defective = result.detail.overall_qty_defective;
            vm.item.stocking.overall_qty_in_transit = result.detail.overall_qty_in_transit;
            vm.gerneric_product_dialog.close();

        }, function error(reason) {
            util.handleErrorWithWindow(reason);
        });
    };

    vm.onPOSNote_change = function () {
        if (vm.product.kit_member) {
            if (vm.item.selling.prompt_pos_note) {
                vm.item.selling.prompt_pos_note = false;
                vm.display_track_inv = null;
                let config = {
                    title: 'Component of a Kit',
                    inline_error_msg: 'This item is currently a component of Kit and cannot be set to prompt for additional information.' +
                        'The Kit can be set to prompt for a point of sale note,but not its components.'
                };
                vm.open_prompt_dialog(config);
            }
        }
    };

    vm.onTrackInventory_Change = function () {

        if (!vm.item.stocking.track_inventory && (vm.product.product_type === 0 || vm.product.product_type === 4)) {

            if (vm.product.serialization === 2) {
                vm.item.stocking.track_inventory = true;
                // vm.dialog_source = "Serialized";
                let config = {
                    title: 'Item Requires Capture of Serial Numbers at Receipt',
                    inline_error_msg: 'This item is set to require serial number to be captured during receiving.Please update the Serialized value' +
                        ' to a value other than require serial numbers to be captured during receiving.'
                };

                vm.open_prompt_dialog(config);
            } else {
                var filter = {
                    item_id: vm.item.id,
                    remove_quantities: false
                };
                product_product_service.check_track_inventory(vm.product.id, filter).then(function (result) {
                        if (!result.status) {
                            vm.item.stocking.track_inventory = true;
                            let config;
                            vm.track_inv_result = result;
                            if (vm.track_inv_result.detail.overall_qty_on_hand && vm.track_inv_result.detail.overall_qty_on_hand !== 0) {
                                config = {
                                    title: 'Item has a Quantity on Hand',
                                    dialog_source: "QOH_not_Zero",
                                    inline_error_msg: 'This item has a quantity on hand value that is not equal to zero. Before the track inventory ' +
                                        'toggle can be turned off, this value must be cleared using the physical inventory application.'
                                };
                            } else {
                                config = {
                                    title: 'Quantity Values Exist for this Item',
                                    dialog_source: "Other_quantity_not_Zero",
                                    inline_error_msg: 'This item has quantity value populated, changing it not to keep quantity values will cause ' +
                                        'these values to be cleared. Please review the details below carefully,as the change cannot be undone.',
                                    done_callback: _clear_stock_sell_values
                                };
                            }
                            vm.open_prompt_dialog(config);
                        }
                    },
                    function error(reason) {
                        util.handleErrorWithWindow(reason);
                    });
            }
        }
    };

    vm.product_discontinued_change = function () {
        if (vm.product.shipper_member.shipper_member === true && vm.product.is_discontinued === true) {
            var text = "This Product is associated with the shipper ";
            for (var i = 0; i < vm.product.shipper_member.shipper_list.length; i++) {
                if (i == 5) {
                    text = text + " etc ";
                    break;
                }
                text = text + vm.product.shipper_member.shipper_list[i] + ", ";
            }
            text = text + "setting it as discontinued will not prevent the shipper from being ordered"
            StdDialog.information(text);
        }
    };

    var orderBy = $filter('orderBy');

    /**
     * component_qty_numeric_box_options
     */
    vm.qty_numeric_box_options = {
        min: 1,
        max: 99999.99,
        format: "{0:#####.##}",
        decimals: 2,
        spinners: false,
        round: false,
        restrictDecimals: true
    };

    vm.kit_components_schema = {
        model: {
            id: "id",
            fields: {
                id: {type: "number"},
                parent_product: {type: "number"},
                child_product: {type: "number"},
                child_uom: {type: "number"},
                child_uom_name: {type: "string"},
                sku: {type: "string"},
                description: {type: "string"},
                quantity: {type: "string"}
            }
        }
    };

    vm.item_buying_1_variant_schema = {
        model: {
            id: "variant_value_1",
            fields: {
                variant_value_1: {
                    editable: false,
                    nullable: false
                },
                variant_value_1_name: {
                    editable: false,
                    nullable: false
                },
                order_point: {
                    type: "string"
                },
                max_quantity: {
                    type: "string"
                },
                qoh: {
                    editable: false,
                    type: "string"
                },
                qav: {
                    editable: false,
                    type: "string"
                },
                qoo: {
                    editable: false,
                    type: "string"
                }

            }
        }
    };

    vm.item_pricing_1_variant_schema = {
        model: {
            id: "variant_value_1",
            fields: {
                variant_value_1: {
                    editable: false,
                    nullable: false
                },
                variant_value_1_name: {
                    editable: false,
                    nullable: false
                },
                replacement_cost: {
                    type: "string"
                },
                average_cost: {
                    editable: false,
                    type: "string"
                },
                last_cost: {
                    editable: false,
                    type: "string"
                }
            }
        }
    };

    // INV-87 - Product History variables
    vm.history_model = kendo.data.Model.define({
        id: "id",
        fields: {
            id: {type: "number"},
            date: {type: "string"},
            total_sold_quantity: {type: "number"},
            total_net_sales: {type: "number"},
            kit_sold_quantity: {type: "number"},
            kit_net_sales: {type: "number"},
            gross_profit: {type: "number"},
            total_received_quantity: {type: "number"},
            total_received_value: {type: "number"},
            shipper_received_quantity: {type: "number"},
            shipper_received_value: {type: "number"},
            total_adjusted_quantity: {type: "number"},
            total_adjusted_value: {type: "number"},
            promotion_quantity: {type: "number"},
            promotion_sales: {type: "number"},
            transferred_in_quantity: {type: "number"},
            transferred_in_value: {type: "number"},
            transferred_out_quantity: {type: "number"},
            transferred_out_value: {type: "number"}
        }
    });

    vm.history_aggregate = [
        {field: "total_sold_quantity", aggregate: "sum"},
        {field: "total_net_sales", aggregate: "sum"},
        {field: "kit_sold_quantity", aggregate: "sum"},
        {field: "kit_net_sales", aggregate: "sum"},
        {field: "gross_profit", aggregate: "sum"},
        {field: "total_received_quantity", aggregate: "sum"},
        {field: "total_received_value", aggregate: "sum"},
        {field: "shipper_received_quantity", aggregate: "sum"},
        {field: "shipper_received_value", aggregate: "sum"},
        {field: "total_adjusted_quantity", aggregate: "sum"},
        {field: "total_adjusted_value", aggregate: "sum"},
        {field: "promotion_quantity", aggregate: "sum"},
        {field: "promotion_sales", aggregate: "sum"},
        {field: "cost_of_goods_sold", aggregate: "sum"},
        {field: "transferred_in_quantity", aggregate: "sum"},
        {field: "transferred_in_value", aggregate: "sum"},
        {field: "transferred_out_quantity", aggregate: "sum"},
        {field: "transferred_out_value", aggregate: "sum"}
    ];

    vm.item_history_grid_data_source = new kendo.data.DataSource({
        sort: {field: "period", dir: "asc"},
        schema: {
            model: vm.history_model
        },
        pageSize: 31,
        aggregate: vm.history_aggregate
    });

    vm.review_grid_selected_data_callback = function () {
        var item_ids = [];
        var selected_ids = [];
        var product_ids = [];
        var product, selected_data_sets = {};
        for (var i = 0; i < vm.review_component_list.length; i++) {
            item_ids = vm.review_component_list[i].item_ids;
            product = vm.review_component_list[i].product_id;
            if (product_ids.indexOf(product) < 0) {
                product_ids.push(product);
            }

            for (var j = 0; j < item_ids.length; j++) {
                selected_ids.push(item_ids[j]);
                selected_data_sets[item_ids[j]] = {
                    id: item_ids[j],
                    product: product
                };
            }
        }

        //Add the standard product at last.
        if (vm.product && vm.product.item_details) {
            product = vm.product.id;
            if (product_ids.indexOf(product) < 0) {
                product_ids.push(product);
            }

            for (var k = 0; k < vm.product.item_details.length; k++) {
                var item_detail = vm.product.item_details[k];
                selected_ids.push(item_detail.id);
                selected_data_sets[item_detail.id] = {
                    id: item_detail.id,
                    product: product
                };
            }
        }
        return {
            selected_ids: selected_ids,
            selected_data_sets: selected_data_sets,
            product_ids: product_ids,
            current_index: -1
        };
    };

    const _format_price_book_prices = function (dataItem) {

        let output = '';

        if (dataItem.quantity_breaks && dataItem.quantity_breaks.length > 0) {

            let discount_label = '';
            let discount_prefix = '';
            let discount_suffix = '';
            let discount_value = '';

            if (dataItem.calculation_type == 0) {
                discount_label = 'For';

            } else if (dataItem.calculation_type == 1 || dataItem.calculation_type == 2) {
                discount_label = "Save";
            } else if (dataItem.calculation_type == 6 || dataItem.calculation_type == 7) {
                discount_label = "For";
                discount_prefix = 'Cost + ';
            } else if (dataItem.calculation_type == 8) {
                discount_label = 'For';
            }

            if (dataItem.calculation_type == 1 || dataItem.calculation_type == 0) {

                if (dataItem.uom_code) {
                    discount_suffix = ' ' + dataItem.uom_code;
                } else {
                    discount_suffix = ' per';
                }
            }

            output += '<div class="quantity_break_display">';

            angular.forEach(dataItem.quantity_breaks, function (value) {

                if (dataItem.calculation_type == 2 || dataItem.calculation_type == 7) {
                    discount_value = value.amount;
                    discount_suffix = '%';
                } else if (dataItem.calculation_type == 8) {
                    discount_value = value.price_type_name;
                } else {
                    discount_value = ep_currencyFilter(value.amount);
                }

                output += '<div class="quantity_break_row row">'
                    + '<div class="col-xs-2 quantity_break_buy_label"><strong>Buy</strong></div>'
                    + '<div class="col-xs-3 quantity_break_buy_quantity">'
                    + util.ep_ui_quantity_format(value.quantity) + '</div>'
                    + '<div class="col-xs-7 quantity_break_discount"><strong>'
                    + discount_label + '</strong> ' + discount_prefix + discount_value + discount_suffix
                    + '</div></div>'
            });
            output += '</div>';
        } else if (dataItem.calculated_info != null) {
            output = ep_currencyFilter(dataItem.calculated_info);

        } else {
            output = 'Click Price Book link to see offer.'
        }

        return output;
    };

    const _configure_nav_bar = function () {
        vm.form_view_service = form_view_maintainer_service.register_service({
            "navigation_service": {
                "shared_component_name": component_name
            },
            "controller_name": "product_controller",
            "app_name": app_name,
            "component_name": component_name,
            "navigation_attribute": "product_ids"
        });
        vm.nav_service = vm.form_view_service.navigation_service;
    };

    vm.component_dialog_clicked = function (delete_product) {
        //Register the session
        session_storage_service.register_storage_for_app_component({
            app_name: app_name,
            component_name: component_name
        });
        vm.review_component_list = [];
        vm.modal_window_size = 'lg';
        vm.disable_review_button = true;
        vm.review_dialog_message = delete_product ? "This product is associated with a Kit or Shipper as a component item and should not be deleted until it has been removed from the Kit or Shipper" : "This Product is associated with the below Kit(s) or Shipper(s) as a component item.";
        var review_dialog_title = delete_product ? "Delete Product" : "Assigned Kits and Shippers";
        product_product_service.check_component(vm.product.id, product_product_service.filter_none()).then(function (result) {
            vm.ks_grid_datasource = new kendo.data.DataSource({
                data: result.kit_list,
                pageSize: 250
            });
        });

        var buttons = [
            {
                text: "Cancel",
                primary: false,
                callback: vm.component_cancel_response
            },
            {
                text: "Review Selected Items",
                primary: true,
                callback: function () {
                    var selected_data_set = vm.review_grid_selected_data_callback();
                    var new_session_data = angular.copy(session_storage_service.get_component_data_from_app_storage("Product", "ProductOverview") || {});
                    new_session_data.selected_ids = selected_data_set.selected_ids;
                    new_session_data.selected_data_sets = selected_data_set.selected_data_sets;
                    new_session_data.product_ids = selected_data_set.product_ids;
                    new_session_data.current_index = selected_data_set.current_index;
                    session_storage_service.insert_or_update_component_data_for_app_storage(app_name,
                        component_name, new_session_data);
                    if (!vm.nav_service.nav_config.app_name) {
                        _configure_nav_bar();
                    }
                    vm.nav_service.render_navigation();
                    vm.nav_service.next_btn_click();
                    vm.component_dialog.close();
                },
                disable_if: "product_controller.disable_review_button"
            }
        ];
        vm.component_dialog = StdDialog.custom({
            size: vm.modal_window_size,
            title: review_dialog_title,
            templateUrl: 'app/product/product_maintenance/views/templates/review_product.html',
            windowClass: 'ep-alert-override-modal',
            auto_close: false,
            auto_focus: false,
            controller_name: "product_controller",
            scope: $scope,
            icon: "mdi mdi-cube-outline",
            buttons: buttons,
            button_type: 'link',
            is_keyboard_support_required: true,
            back_action: vm.component_cancel_response
        });
    };

    vm.review_grid_change = function (event) {
        vm.review_component_list = [];
        var rows = event.sender.select(), grid = $("#ks_grid").data("kendoGrid"), product_id, dataItem;
        rows.each(function (e) {
            dataItem = grid.dataItem(this);
            vm.review_component_list.push(dataItem.toJSON());
        });
        vm.disable_review_button = (vm.review_component_list.length > 0) ? false : true;

        //Calling apply due to delay in running Digest Cycle.
        if (!$scope.$root.$$phase) {
            $scope.$apply();
        }
    };

    vm.ks_grid_options = {
        dataBound: function () {
            var grid = this, dataArea;
            var gridElement = angular.element("#ks_grid");
            if (gridElement) {
                if (grid.dataSource.total() == 0) {
                    dataArea = gridElement.find(".k-grid-content");
                    dataArea.height(0);
                } else {
                    dataArea = gridElement.find(".k-grid-content");
                    dataArea.height(200);
                }
            }
            non_reorderable_column_for_review = grid.columns[0];
        },
        columnReorder: function (e) {
            const grid = e.sender;
            $timeout(() => {
                grid.reorderColumn(0, non_reorderable_column_for_review);
            })
        },
        columnMenu: util.ep_grid_column_menu,
        resizable: util.ep_grid_resizeable,
        reorderable: util.ep_grid_reorderable,
        scrollable: util.ep_grid_scrollable,
        pageable: util.ep_grid_pageable_options,
        filterable: util.ep_grid_filterable,
        columns: [
            {
                selectable: true,
                width: 40,
                minResizableWidth: 20,
                headerAttributes: {"class": "ep-table-header-cell ep-generic-multi-select-header"},
                attributes: {"class": "ep-table-cell-center ep-generic-multi-select-cell"}
            },
            {
                title: "Item",
                field: "sku",
                headerAttributes: {"class": "ep-table-header-cell"},
                minResizableWidth: util.ep_grid_column_min_resize_width,
                width: 100
            },
            {
                title: "Description",
                field: "description",
                headerAttributes: {"class": "ep-table-header-cell"},
                minResizableWidth: util.ep_grid_column_min_resize_width,
                width: 100
            },
            {
                title: "Store",
                field: "branch_names",
                headerAttributes: {"class": "ep-table-header-cell"},
                minResizableWidth: util.ep_grid_column_min_resize_width,
                width: 100
            }

        ]

    };

    vm.component_cancel_response = function () {
        if (vm.component_dialog) {
            vm.component_dialog.close();
        }
    };

    vm.check_access_to_serial_tab = function () {
        if (vm.product.product_type === 0 || vm.product.product_type === 4) {
            vm.has_serial_number_tab_access = true;
        } else {
            vm.has_serial_number_tab_access = false;
        }
        if (!vm.all_inventory_access_obj.access_product_maintenance_serial_number || vm.product.serialization === 1) {
            vm.has_serial_number_tab_access = false;
        }

        if (!$scope.$root.$$phase) {
            $scope.$apply();
        }
        //return vm.has_serial_number_tab_access;

    };

    vm.show_serialized_dropdown = function () {
        let show_dropdown = false;
        if (vm.product.product_type === 0 || vm.product.product_type === 4) {
            show_dropdown = true;
        } else {
            show_dropdown = false;
        }
        if (!vm.all_inventory_access_obj.access_product_maintenance_serial_number) {
            show_dropdown = false;
        }
        return show_dropdown;
    };

    const _get_note_filter_data = function () {
        return {
            search: vm.note_search_value
        };
    };

    /**
     * Set the default price type
     * @private
     */
    const _set_default_price_type = function () {
        if (vm.system_default_price_type) {
            vm.selling_price_label = vm.system_default_price_type_name;
        } else {
            vm.selling_price_label = "Selling Price";
        }
    };

    //All Product required permission has to list here
    const all_permission_arr = [
        'access_price_cost',
        'access_buying_supplier_tab',
        'access_costs_gp_information',
        'add_edit_item',
        'access_product_history',
        'access_price_books',
        'access_product_maintenance_serial_number',
        'access_purchase_order',
        'access_deletes_from_actions',
        'access_product_change_average_cost',
        'access_thrift_activity'
    ];

    const _get_permission_access = function () {
        vm.all_inventory_access_obj = {};
        all_permission_arr.forEach((val) => {
            vm.all_inventory_access_obj[val] = vm.can_access(val);
        });
    };

    function init() {
        _get_permission_access();
        vm.form_view_service = form_view_maintainer_service.register_service({
            "navigation_service": {
                "shared_component_name": component_name
            },
            "controller_name": "product_controller",
            "app_name": app_name,
            "component_name": component_name,
            "navigation_attribute": "product_ids",
            "tab_settings": {
                "default_tab_index": default_tab_index,
                "selected_tab_index": default_tab_index,
                "is_tab_persistance_required": true
            }
        });
        vm.nav_service = vm.form_view_service.navigation_service;

        set_product_array();

        if ($rootScope.rs_toogo_user.active_branch) {
            vm.current_active_branch = $rootScope.rs_toogo_user.active_branch.id;
        } else {
            vm.current_active_branch = 0;
        }

        vm.store_list_popover_options = {
            isOpen: false,
            templateUrl: 'app/product/product_maintenance/views/templates/product_store_list.html'
        };
        vm.toolbar_action_list_popover_options = {
            isOpen: false,
            templateUrl: 'app/product/product_maintenance/views/templates/product_toolbar_actions_list.html'
        };

        vm.product_search_data_source = product_product_service.get_record_server_filter_data_source(util.ad_find_options(true, false),
            product_product_service.filter_top_level_products(), 10, $scope);

        if (!vm.active_branch && $rootScope.rs_toogo_user && $rootScope.rs_toogo_user.active_branch) {
            vm.active_branch = $rootScope.rs_toogo_user.active_branch.id;
        }

        set_toolbar();
        get_product_data();
        get_item_data();
        get_shared_data();
        set_modal_buttons();

        if ($routeParams && $routeParams.id) {
            vm.add_mode = false;
            const tab_settings = vm.nav_service.get_tab_settings(app_name, component_name);
            vm.tab_selected_index = tab_settings && tab_settings.selected_tab_index ? tab_settings && tab_settings.selected_tab_index : default_tab_index;
            if ($routeParams.id == 'list') {
                get_product_record(vm.product_id_list[0].product, true);
            } else {
                get_product_record($routeParams.id);
            }
        } else {
            vm.add_mode = true;
            vm.focus_sku = true;
            vm.tab_selected_index = default_tab_index;
        }

        if (vm.add_mode) {
            vm.product.product_type = 0;
            vm.product.price_by = 0;
            vm.product.is_discountable = true;
            vm.nav_service.clear_navigation(app_name, component_name);
        }

        if (vm.add_mode) {
            vm.toolbar_breadcrumbs = util.bread_crumb_string_generator([
                {name: "Products"},
                {name: "Product Overview", href: "products/grid"},
                {name: "Product"}
            ]);
        } else {
            vm.toolbar_breadcrumbs = util.bread_crumb_string_generator([
                {name: "Products"},
                {name: "Product Overview", href: "products/grid"},
                {name: "Edit Product - <strong>{[{product_controller.product.sku | eptruncate:20:'...' }]}</strong>"}
            ], $scope);
        }

        $timeout(function () {
            vm.focus_sku = true;
        });

        vm.image_maint = new ImageMaintainer({
            images: vm.images,
            private_images: false,
            controller_name: 'product_controller',
            scope: $scope
        });
    }

    vm.open_image_maintenance = function open_image_maintenance() {
        // Close panel after selecting Image Maintenance
        if (vm.product_actions_panel) {
            vm.product_actions_panel.close();
        }
        var image_maint_title = '';
        if (vm.product.description && vm.product.description.length > 0) {
            image_maint_title = vm.product.description;
        } else if (vm.product.extended_description && vm.product.extended_description.length > 0) {
            image_maint_title = vm.product.extended_description;
        }
        vm.image_maint.open(image_maint_title);
    };

    vm.open_price_book_dialog = function () {

        vm.modal_window_size = 'lg';
        var buttons = [
            {
                text: "Close",
                primary: true,
                callback: vm.price_book_done_callback
            }
        ];

        vm.price_book_dialog = StdDialog.custom({
            size: vm.modal_window_size,
            title: "Special Pricing",
            templateUrl: '/app/product/product_maintenance/views/templates/product_price_book.html',
            windowClass: 'ep-alert-override-modal',
            auto_close: false,
            auto_focus: true,
            controller_name: "product_controller",
            scope: $scope,
            icon: "mdi mdi-factory",
            buttons: buttons,
            rendered_callback: vm.price_book_dialog_callback,
            back_action: vm.price_book_done_callback,
            is_keyboard_support_required: true
        });
    };

    vm.price_book_dialog_callback = function () {

    };

    vm.price_book_done_callback = function () {
        if (vm.price_book_dialog) {
            vm.price_book_dialog.close();
        }
    };


    vm.add_store = function () {
        if (!vm.add_mode) {
            vm.show_add_to_stores = !vm.show_add_to_stores;
        }
    };

    vm.setup_firearm_fields = function () {
        vm.loading_firearm = false;
        //vm.last_brand_id = "";
        if (vm.product.product_type == product_firearm && vm.product.firearm_type && vm.product.firearm_type.length > 0) {
            vm.firearm_initialized = false;
            vm.loading_firearm = true;
            // Timeout because the fields are available exactly when the product is loaded.
            $timeout(function () {
                var Element = $("#firearm_type").data("kendoDropDownList");
                Element.value(vm.product.firearm_type);
                Element.trigger("select");
            }, 2500);
        } else {
            vm.firearm_initialized = true;
            vm.firearm_type = vm.product.firearm_type;
            vm.firearm_manufacturer = vm.product.firearm_manufacturer;
            vm.firearm_model = vm.product.firearm_model;
            vm.firearm_caliber_or_gauge = vm.product.firearm_caliber_or_gauge;
        }
    };


    vm.check_product_specifications_validity = function () {
        var valid = true;
        var required_satisfied = true;
        var error_message = "";
        var missing_units = "";

        if ((vm.product.height && (angular.isUndefined(vm.product.height_unit) || vm.product.height_unit === null || (angular.isDefined(vm.product.height_unit) && vm.product.height_unit.length <= 0))) ||
            (vm.product.width && (angular.isUndefined(vm.product.width_unit) || vm.product.width_unit === null || (angular.isDefined(vm.product.width_unit) && vm.product.width_unit.length <= 0))) ||
            (vm.product.length && (angular.isUndefined(vm.product.length_unit) || vm.product.length_unit === null || (angular.isDefined(vm.product.length_unit) && vm.product.length_unit.length <= 0))) ||
            (vm.product.cube && (angular.isUndefined(vm.product.cubic_unit) || vm.product.cubic_unit === null || (angular.isDefined(vm.product.cubic_unit) && vm.product.cubic_unit.length <= 0))) ||
            (vm.product.weight && (angular.isUndefined(vm.product.weight_unit) || vm.product.weight_unit === null || (angular.isDefined(vm.product.weight_unit) && vm.product.weight_unit.length <= 0)))
        ) {
            if (vm.product_specification_dialog) {
                vm.product_specification_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
            } else {
                StdDialog.error(util.missing_fields_content, util.missing_fields_title);
            }
            valid = false;
        }


        if (vm.product.height_unit === null || vm.product.height_unit.length == 0) {
            vm.product.height_unit = null;
        }
        if (!angular.isString(vm.product.height) && !vm.product.height == null) {
            vm.product.height = vm.product.height.toString();
        }
        if (vm.product.width_unit === null || vm.product.width_unit.length == 0) {
            vm.product.width_unit = null;
        }
        if (!angular.isString(vm.product.width) && !vm.product.width == null) {
            vm.product.width = vm.product.width.toString();
        }
        if (vm.product.length_unit === null || vm.product.length_unit.length == 0) {
            vm.product.length_unit = null;
        }
        if (!angular.isString(vm.product.length) && !vm.product.length == null) {
            vm.product.length = vm.product.length.toString();
        }
        if (vm.product.cubic_unit === null || vm.product.cubic_unit.length == 0) {
            vm.product.cubic_unit = null;
        }
        if (!angular.isString(vm.product.cube) && !vm.product.cube == null) {
            vm.product.cube = vm.product.cube.toString();
        }
        if (vm.product.weight_unit === null || vm.product.weight_unit.length == 0) {
            vm.product.weight_unit = null;
        }
        if (!angular.isString(vm.product.weight) && !vm.product.weight == null) {
            vm.product.weight = vm.product.weight.toString();
        }

        return valid;
    };

    vm.check_product_uom_validity = function () {

        if (vm.product_selling_uom_multiple === null) {
            vm.product_uom_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
            return false;
        }

        if (vm.product_stocking_uom === vm.product_selling_uom && parseInt(vm.product_selling_uom_multiple) !== 1) {
            vm.product_uom_dialog.inline_error_message("Selling Multiple must be 1 when Stocking UOM and Default Selling Unit of Measure are the same.");
            return false;
        }

        if ((vm.product.product_type !== product_membership_fee && vm.product.product_type !== product_kit)
            && vm.uom_order_multiple === null) {
            vm.product_uom_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
            return false;
        }

        if (vm.product_selling_uom_multiple <= 0) {
            vm.product_uom_dialog.inline_error_message("Selling Multiple needs to be greater than 0.");
            return false;
        }

        if ((vm.product.product_type !== product_membership_fee && vm.product.product_type !== product_kit) && vm.uom_order_multiple <= 0) {
            vm.product_uom_dialog.inline_error_message("Order Multiple needs to be greater than 0.");
            return false;
        }

        return true;
    };

    vm.check_product_validity = function () {
        var valid = true;
        var error_message = "";

        if (vm.product && !(vm.product.id)) {
            error_message += "<p>Use the Item Quick Setup to add a new product.</p>";
            valid = false;
        }
        if (valid && vm.loading_firearm) {
            error_message += "<p>Firearm still loading.  Try again when loading finished.</p>";
            valid = false;
        }
        if (valid && vm.product.product_type == '1') {
            // Need to have at least one value for each attribute selected.
            if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0) {
                angular.forEach(vm.edit_product_attributes, function (attribute) {
                    if (valid && attribute.attribute_values && attribute.attribute_values.length == 0) {
                        error_message += "<p>Variant type products need at least one value defined for each attribute.</p>";
                        valid = false;
                    }
                });
            } else {
                error_message += "<p>Variant type products need at least one attribute defined.</p>";
                valid = false;
            }

        }

        if (error_message) {
            StdDialog.information(error_message);
        }
        return valid;
    };

    vm.check_pricing_validity = function () {
        var valid = true;
        var error_message = "";


        var alt_sel_units = vm.alternate_unit_grid_data_source.data().toJSON();
        var blank_or_zero_selling_multiple = alt_sel_units.some(function (elem) {
            return (elem.selling_multiple === null || elem.uom == "");
        });

        if (alt_sel_units.length > 1) {
            var same_price_type__dup_uom = alt_sel_units.some(function (elem, index, array) {
                return index !== array.findIndex(function (el) {
                    return el.uom == elem.uom && el.price_type == elem.price_type;
                });
            });

            var default_price_type = vm.system_default_price_type;
            let default_price_missing_object;
            var default_price_type_non_existent = alt_sel_units.some(function (elem, index, array) {
                default_price_missing_object = elem;
                return elem.price_type !== default_price_type && array.findIndex(function (el) {
                    return el.price_type == default_price_type && el.uom == elem.uom;
                }) < 0;
            });
            if (default_price_type_non_existent) {
                if (default_price_missing_object.price_type !== vm.selling_price.price_type &&
                    default_price_missing_object.uom == vm.selling_price.selling_price_uom) {
                    default_price_type_non_existent = false;
                }
            }

            var same_uom__diff_price_type__diff_sell_multiple = alt_sel_units.some(function (elem, index, array) {
                return array.findIndex(function (el) {
                    return el.uom == elem.uom && el.price_type != elem.price_type && el.selling_multiple != elem.selling_multiple;
                }) > -1;
            });

            var same_sell_multiple__diff_uom = alt_sel_units.some(function (elem, index, array) {
                return array.findIndex(function (el) {
                    return el.selling_multiple == elem.selling_multiple && el.uom != elem.uom;
                }) > -1;
            });

            if (same_price_type__dup_uom) {
                error_message += "<p>The combination of Price Type and Unit of Measure must make a unique set.</p>";
                valid = false;
            }

            if (default_price_type_non_existent) {
                error_message += "<p> Missing an alternate price record with UOM " + default_price_missing_object.selling_price_uom_name + " for default price type.</p>";
                valid = false;
            }

            if (same_uom__diff_price_type__diff_sell_multiple) {
                error_message += "<p>Alternate Prices can't have matching UOM with different selling multiple.</p>";
                valid = false;
            }

            if (same_sell_multiple__diff_uom) {
                error_message += "<p>Different UOMs cannot have same Sell Multiple.</p>";
                valid = false;
            }
        }

        if (vm.item) {
            if (valid && vm.product.product_type == '1' && vm.edit_pricing_variant_detail.length > 0) {
                for (var x = 0; vm.edit_pricing_variant_detail.length > x; x++) {
                    if (vm.edit_pricing_variant_detail[x].selling_price &&
                        vm.edit_pricing_variant_detail[x].selling_price > 0 &&
                        (vm.selling_price.price_type == null || vm.selling_price.selling_price_uom == null)) {
                        valid = false;
                    }
                }
                if (valid == false) {
                    error_message += "<p>Selling price type and unit of measure must be specified when entering variant Selling Price.<p>";
                }
            }
        }

        if (blank_or_zero_selling_multiple) {
            StdDialog.error(util.missing_fields_content, util.missing_fields_title);
        }
        if (error_message) {
            StdDialog.information(error_message);
        }
        return valid;
    };

    vm.check_firearm_validity = function () {
        var valid = true;

        if (vm.product.product_type == product_firearm) {
            if (vm.firearm_type === null || vm.firearm_manufacturer === null || vm.firearm_model === null || vm.firearm_caliber_or_gauge === null ||
                vm.firearm_type == "" || vm.firearm_manufacturer == "" || vm.firearm_model == "" || vm.firearm_caliber_or_gauge == "") {
                StdDialog.error(util.missing_fields_content, util.missing_fields_title);
                valid = false;
            }
        }
        return valid;
    };

    vm.check_product_brand_validity = function () {
        var valid = false;
        var is_error = false;
        var name_empty = true;
        var uom_empty = true;
        var factor_empty = true;

        if (vm.consumer_brand_name && vm.consumer_brand_name.length > 0) {
            name_empty = false;
        }
        if (vm.brand_comparison_uom && vm.brand_comparison_uom > 0) {
            uom_empty = false;
        }
        if (vm.brand_comparison_conversion_factor && vm.brand_comparison_conversion_factor > 0) {
            factor_empty = false;
        }
        // All fields must be filled in or all fields left blank.
        if (name_empty && uom_empty) {
            valid = true;
            if (factor_empty) {
                vm.brand_comparison_conversion_factor = 1;
                factor_empty = false;
            }

        } else if (!name_empty && !uom_empty) {
            valid = true;
        } else {
            is_error = true;
        }
        if (factor_empty) {
            valid = false;
            is_error = true;
        }

        if (is_error) {
            valid = false;
            if (vm.product_brand_dialog) {
                vm.product_brand_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
            } else {
                StdDialog.error(util.missing_fields_content, util.missing_fields_title);
            }

        }
        return valid;
    };

    function missing_fields() {
        if (!(vm.product.sku && vm.product.description && vm.product.category) ||
            (vm.product.price_by === prompt_price_tye && !vm.product.desired_gp_percent && vm.product.product_type !== product_gift_card)) {
            return true;
        }
        return false;
    }

    const _add_back_deleted_ids = function () {
        let branch, prices;
        for (let i = 0; i < vm.product.item_details.length; i++) {
            branch = vm.product.item_details[i].branch;
            prices = vm.product.item_details[i].prices;
            for (let j = 0; j < prices.length; j++) {
                if (!prices[j].is_default) {
                    if (vm.delete_au_map[branch] && vm.delete_au_map[branch].au_records) {
                        vm.delete_au_map[branch].au_records.forEach(function (price) {
                            if (prices[j].default_text === price.default_text && prices[j].uom === price.uom) {
                                prices[j].id = price.id;
                                prices[j].product_price = price.product_price;
                            }
                        });
                    }
                }
            }
        }
    };

    const _add_back_deleted_ids_product_variants = function () {
        let currently_displayed_store_prices = vm.item.prices;
        vm.product.product_variants[vm.variant_main_id].product_prices.forEach(function (variants) {
            if (!variants.is_default && currently_displayed_store_prices) {
                currently_displayed_store_prices.forEach(function (item_price) {
                    if (variants.price_type == item_price.price_type && variants.uom == item_price.uom) {
                        variants.id = item_price.product_price;
                    }
                });
            }
        });
    };

    vm.save_product = function () {
        var overflow = false;
        var valid_product = vm.check_product_validity();
        var valid_pricing = false;
        vm.refresh_calculations_when_store_changes = false;

        if (valid_product) {
            if (vm.wait_for_save) {
                var listener = $scope.$watch("product_controller.wait_for_save", function (val) {
                    if (!val) {
                        listener();
                        vm.save_product();
                    }
                });
                return;
            }
            if (missing_fields()) {
                StdDialog.error(util.missing_fields_content, util.missing_fields_title);
                return;
            } else if (vm.product.serialization === 2) {
                let is_track_inv = true;
                for (let i = 0; i < vm.product.item_details.length; i++) {
                    if (vm.product.item_details[i].stocking && vm.product.item_details[i].stocking.track_inventory === false) {
                        is_track_inv = false;
                        break;
                    }
                }
                if (!is_track_inv) {
                    let config = {
                        title: 'Item Does Not Track Quantity',
                        inline_error_msg: 'This item is set not to track quantities and as such cannot be set to require serial numbers to be captured during receiving.'
                    };
                    vm.open_prompt_dialog(config);
                    return;
                }
            }

            //var valid_product_uoms = vm.check_product_uoms_validity(vm.product.product_uoms);
            var valid_firearm = vm.check_firearm_validity();

            //if (valid_product_uoms && valid_firearm && vm.check_item_uoms_validity()) {
            if (valid_firearm && vm.check_item_uoms_validity()) {
                angular.forEach(vm.product.product_uoms, function (product_uom) {
                    if (product_uom.height_unit == null || product_uom.height_unit.length <= 0) {
                        product_uom.height_unit = null;
                    }
                    if (product_uom.width_unit == null || product_uom.width_unit.length <= 0) {
                        product_uom.width_unit = null;
                    }
                    if (product_uom.length_unit == null || product_uom.length_unit.length <= 0) {
                        product_uom.length_unit = null;
                    }
                    if (product_uom.cubic_unit == null || product_uom.cubic_unit.length <= 0) {
                        product_uom.cubic_unit = null;
                    }
                    if (product_uom.weight_unit == null || product_uom.weight_unit.length <= 0) {
                        product_uom.weight_unit = null;
                    }
                });

                if (vm.item.last_counted_date) {
                    vm.item.last_counted_date = moment(vm.item.last_counted_date).format('YYYY-MM-DD');
                }
                if (vm.item.last_received_date) {
                    vm.item.last_received_date = moment(vm.item.last_received_date).format('YYYY-MM-DD');
                }
                if (vm.item.last_sold_date) {
                    vm.item.last_sold_date = moment(vm.item.last_sold_date).format('YYYY-MM-DD');
                }
                if (vm.item.last_returned_date) {
                    vm.item.last_returned_date = moment(vm.item.last_returned_date).format('YYYY-MM-DD');
                }
                if (vm.item.record_added_date) {
                    vm.item.record_added_date = moment(vm.item.record_added_date).format('YYYY-MM-DD');
                }

                if (vm.item.stocking && vm.item.stocking.bin_locations)
                    _format_location_codes();

                valid_pricing = vm.check_pricing_validity();
                if (valid_pricing) {
                    vm.fill_product_record();
                    if (vm.all_inventory_access_obj.access_price_cost) {
                        for (var z = 0; z < vm.product.item_details.length; z++) {
                            if (!vm.product.item_details[z].hasOwnProperty('is_deleted') && check_for_price(vm.product.item_details[z].branch)) {
                                StdDialog.error("Default Price is required for " + vm.product.item_details[z].branch_name + ". Please provide price.");
                                return false;
                            }
                        }
                    }
                    if (overflow) {
                        vm.save_toolbar_button_overflow.start();
                    } else {
                        vm.save_toolbar_button.start();
                    }
                    if (overflow) {
                        vm.save_toolbar_button_overflow.start();
                    } else {
                        vm.save_toolbar_button.start();
                    }

                    if (vm.all_inventory_access_obj.access_price_cost) {
                        _add_back_deleted_ids();
                        _add_back_deleted_ids_product_variants();//Add products variant type product variant
                    }
                    if (vm.product && vm.product.id) {
                        //Before saving delete all the items with id_deleted == true
                        for (var x = 0; x < vm.product.item_details.length; x++) {
                            if (vm.product.item_details[x].is_deleted) {
                                vm.product.item_details.splice(x, 1);
                            }
                        }
                        vm.product.branch_used_for_price_calculation = vm.item.branch;
                        //delete the dummy supplier data when no buying tab permission before save
                        if (!vm.all_inventory_access_obj.access_buying_supplier_tab) {
                            for (var i = 0; i < vm.product.item_details.length; i++) {
                                var item_detail = vm.product.item_details[i];
                                delete item_detail.buying.suppliers;
                            }
                        } else {
                            //if adding supplierIU set id to null
                            angular.forEach(vm.product.item_details, function (item_detail) {
                                angular.forEach(item_detail.buying.suppliers, function (supplierIU) {
                                    if (supplierIU.id < 0) {
                                        supplierIU.id = null;
                                    }
                                });
                            });
                        }

                        _format_notes(); //Formats notes as required by the api.
                        product_product_service.update_record(vm.product, util.ad_patch_options(false)).then(function (product) {
                            vm.product = product;

                            //mimic supplier data when no buying tab permission
                            if (!vm.all_inventory_access_obj.access_buying_supplier_tab) {
                                insert_supplier_data_no_buying_access();
                            }
                            vm.deleted_alternate_units = [];
                            vm.delete_au_map = {};
                            _get_original_price_id();
                            vm.prev_price_by = null;
                            vm.image_maint.updateImageIds(product);
                            vm.product.product_uoms = orderBy(vm.product.specifications, ['uom_name'], false);
                            vm.product.kit_components = orderBy(vm.product.kit_components, ['sku'], false);
                            //vm.set_uom_for_default_uom_data_source();
                            vm.set_product_prices();
                            vm.get_branch_records(false);
                            vm.alternate_deleted_price = [];
                            //var not_found_store = true;
                            if (vm.is_item_displayed) {
                                angular.forEach(vm.product.item_details, function (item_detail) {
                                    if (item_detail.branch == vm.item.branch) {
                                        var save_uom_name = vm.item.stocking.uom_name;
                                        vm.item = item_detail;
                                        _sort_location_codes();
                                        vm.item.stocking.uom_name = save_uom_name;
                                        if (vm.all_inventory_access_obj.access_price_cost) {
                                            vm.set_product_prices();
                                            vm.set_item_prices();
                                        }
                                        vm.set_variant_values();
                                        vm.set_suppliers();
                                        if (vm.all_inventory_access_obj.access_price_cost) {
                                            vm.set_price_books();
                                        }
                                        if (vm.upc_added == true) {
                                            vm.set_upc();
                                        }

                                        //not_found_store = false;
                                    }
                                });

                                if (vm.product.product_type === product_kit || vm.product.product_type === product_shipper) {
                                    _get_components_details(vm.product.id, vm.item.branch, vm.product.kit_components);
                                    $scope.$broadcast("product_save_success");
                                }

                                //When the branch deleted is locally it is not saved in the server in past. this will be executed.
                                //SO, showing the default branch
                                // if(not_found_store){
                                //     var active_branch_item = vm.product.item_details.filter(function(item){
                                //         return item.branch === vm.current_active_branch;
                                //     });
                                //
                                //     //Check if default branch exists, if exists show it otherwise show the first branch.
                                //     if(active_branch_item.length > 0){
                                //         vm.item = active_branch_item[0];
                                //     } else {
                                //         vm.item = vm.product.item_details[0];
                                //     }
                                //
                                //     if(vm.item){
                                //         vm.item.stocking.uom_name = vm.item.stocking.uom_name;
                                //         vm.set_product_prices();
                                //         vm.set_item_prices();
                                //         vm.set_variant_values();
                                //         vm.set_suppliers();
                                //         vm.disable_component_grid = false;
                                //         if(vm.product.product_type === product_kit || vm.product.product_type === product_shipper){
                                //             _get_components_details(vm.product.id, vm.item.branch, vm.product.kit_components);
                                //             $scope.$broadcast("get_new_item_details");
                                //         }
                                //     }
                                // }
                            }
                            var init_value = [];
                            init_value.push(vm.product);
                            $scope.ep_maintenance_toolbar_search.dataSource.data(init_value);
                            if (overflow) {
                                vm.save_toolbar_button_overflow.success();
                            } else {
                                vm.save_toolbar_button.success();
                            }

                            if (vm.product.product_type !== product_kit && vm.product.product_type !== product_shipper && vm.product.product_type !== product_membership_fee && vm.product.product_type !== product_fee && vm.product.product_type !== product_donation) {
                                // if(vm.product.price_by === 0) {
                                //     _reset_alternate_unit_prices();
                                // }
                                _refresh_alternate_grid(); //Reload the alternate grid
                                _reset_grid_dirty_flags();
                                if ($("#alternate_unit_grid").data("kendoGrid"))
                                    $("#alternate_unit_grid").data("kendoGrid").refresh();
                            }

                            $timeout(function () {
                                unsaved_data_tracker.reset();
                            });

                            vm.check_access_to_serial_tab();
                            vm.tabs.serial_numbers =vm.has_serial_number_tab_access;
                            if (vm.has_serial_number_tab_access) {
                                $scope.$broadcast('product_data_changed');
                            }
                            let notes_updated = true;
                            $scope.$broadcast('product_notes_record_changed', vm.product, notes_updated);
                        }, function error(reason) {
                            //mimic supplier data when no buying tab permission if the update fails
                            if (!vm.all_inventory_access_obj.access_buying_supplier_tab) {
                                insert_supplier_data_no_buying_access();
                            }
                            if (overflow) {
                                vm.save_toolbar_button_overflow.failure();
                            } else {
                                vm.save_toolbar_button.failure();
                            }
                            vm.kit_or_shipper = null;
                            if (reason.data.hasOwnProperty('Validation') && reason.data.Validation[0].hasOwnProperty('kit_or_shipper_component_serializer') ) {
                                 vm.kit_or_shipper_data_source = new kendo.data.DataSource({
                                     pageSize : 99999,
                                 });
                                vm.kit_or_shipper_data_source.data(reason.data.Validation[0].kit_or_shipper_component_serializer);
                                vm.kit_or_shipper_options = {
                                    dataBound: function () {
                                        var grid = this, dataArea;
                                        var gridElement = angular.element("#ks_grid");
                                        if (gridElement) {
                                            if (grid.dataSource.total() === 0) {
                                                dataArea = gridElement.find(".k-grid-content");
                                                dataArea.height(0);
                                            } else {
                                                dataArea = gridElement.find(".k-grid-content");
                                                dataArea.height(200);
                                            }
                                        }
                                        non_reorderable_column_for_review = grid.columns[0];
                                    },
                                    columnReorder: function (e) {
                                        const grid = e.sender;
                                        $timeout(() => {
                                            grid.reorderColumn(0, non_reorderable_column_for_review);
                                        })
                                    },
                                    columnMenu: util.ep_grid_column_menu,
                                    resizable: util.ep_grid_resizeable,
                                    reorderable: util.ep_grid_reorderable,
                                    scrollable: util.ep_grid_scrollable,
                                    pageable: util.ep_grid_pageable_options,
                                    filterable: util.ep_grid_filterable,
                                    columns: [
                                        {
                                            title: "Item",
                                            field: "item",
                                            headerAttributes: {"class": "ep-table-header-cell"},
                                            minResizableWidth: util.ep_grid_column_min_resize_width,
                                            width: 100
                                        },
                                        {
                                            title: "Description",
                                            field: "description",
                                            headerAttributes: {"class": "ep-table-header-cell"},
                                            minResizableWidth: util.ep_grid_column_min_resize_width,
                                            width: 100
                                        },
                                        {
                                            title: "Type",
                                            field: "type",
                                            headerAttributes: {"class": "ep-table-header-cell"},
                                            minResizableWidth: util.ep_grid_column_min_resize_width,
                                            width: 100
                                        }

                                    ]

                                };
                                vm.kit_or_shipper_dailog = StdDialog.custom({
                                    show_title_bar: true,
                                    templateUrl: '/app/product/product_maintenance/views/templates/kit_or_shipper_error_grid_dailog.html',
                                    controller_name: 'product_controller',
                                    scope: $scope,
                                    auto_close: false,
                                    size: 'md',
                                    windowClass: 'ep-alert-override-modal',
                                    icon: 'mdi md-24px mdi-alert-circle',
                                    title: 'Product Serialization',
                                    buttons: [
                                        {
                                            text: 'Ok',
                                            callback: () => {
                                                vm.kit_or_shipper_dailog.close()
                                            }
                                        },


                                    ],
                                    is_keyboard_support_required: true
                                });
                            } else {
                                $timeout(function () {
                                    util.handleErrorWithWindow(reason);
                                }, 2500);
                            }
                        });
                    } else {
                        product_product_service.create_record(vm.product, util.ad_create_options(false)).then(function (data) {
                            if (overflow) {
                                vm.save_toolbar_button_overflow.success();
                            } else {
                                vm.save_toolbar_button.success();
                            }
                            vm.alternate_deleted_price = [];
                            $timeout(function () {
                                $location.path('products/productitem/edit/' + data.id);
                            }, 2500);

                        }, function error(reason) {
                            if (overflow) {
                                vm.save_toolbar_button_overflow.failure();
                            } else {
                                vm.save_toolbar_button.failure();
                            }

                            $timeout(function () {
                                util.handleErrorWithWindow(reason);
                            }, 2500);
                        });
                    }
                } else {
                    if (overflow) {
                        vm.save_toolbar_button_overflow.failure();
                    } else {
                        vm.save_toolbar_button.failure();
                    }
                }

            }
        }
    };

    vm.query_existing_tags = function (query) {
        if (query.length <= 20) {
            return product_tags_lookup_service.get_records_with_limit(util.ad_find_options(true, false),
                product_tags_lookup_service.filter_tags(query), 10);
        }
    };

    //vm.save_variant_grid_data = function() {
    //    if (vm.product.product_type == '1') {
    //        // How many variants are there?
    //        if (vm.edit_product_attributes) {
    //            if (vm.edit_product_attributes.length == 1) {
    //                //Sync the current data source to get any unsaved values.
    //                vm.item_buying_1_variant_grid_data_source.sync();
    //
    //                // Copy datasource values to item record.
    //                // put vm.item_buying_variant_data structure into the saved structure or item record.
    //                // .id, .qoh, .order_point, .max_quantity
    //                // kld todo
    //            }
    //        }
    //    }
    //
    //};

    vm.fill_product_record = function () {
        // Move screen values back to product structure.
        var x = 0;
        var z = 0;
        var y = 0;
        var new_value = null;

        // All products have a price in this structure even it they are doing by store pricing.
        if (vm.all_inventory_access_obj.access_price_cost && vm.product.product_variants && vm.variant_main_id >= 0) {

            // Clear out the Product Pricing structure
            vm.product.product_variants[vm.variant_main_id].product_prices = [];
            // Add in the displayed product pricing structure.
            if (vm.product.price_by == 2 || vm.prev_price_by == 3) {
                vm.selling_price.product_amount = vm.selling_price.amount;
            }

            //Below code commented and included in update_prices_or_get_unsaved_prices
            // vm.product.product_variants[vm.variant_main_id].product_prices.push({
            //     price_type: vm.system_default_price_type,
            //     uom: vm.selling_price.selling_price_uom,
            //     uom_name: vm.selling_price.selling_price_uom_name,
            //     price: parseFloat(vm.selling_price.product_amount),
            //     selling_multiple: vm.product_selling_uom_multiple,
            //     is_default: true,
            //     id: vm.selling_price.product_price
            // });
            //
            // angular.forEach(vm.alternate_selling_price, function (price_record) {
            //     vm.product.product_variants[vm.variant_main_id].product_prices.push({
            //         price_type: price_record.price_type,
            //         uom: price_record.selling_price_uom,
            //         uom_name: price_record.selling_price_uom_name,
            //         price: parseFloat(price_record.selling_product_amount),
            //         selling_multiple: price_record.selling_multiple,
            //         is_default: false,
            //         default_text:price_record.default_text,
            //         id: price_record.product_price
            //
            //     });
            //
            // });
            vm.update_prices_or_get_unsaved_prices('product_level');
        }

        if (vm.product && vm.product.kit_components && vm.product.kit_components.length > 0) {
            if (vm.product.product_type != '2' && vm.product.product_type != '7') {
                vm.product.kit_components = [];
            }
        }

        if (vm.selected_category != vm.selected_category_default) {
            vm.product.category = vm.selected_category_id;
            vm.product.category_name = vm.selected_category;
        }

        if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0) {
            if (vm.product.product_type != '1') {
                vm.edit_product_attributes = [];
            } else {
                for (x = 0; x < vm.edit_product_attributes.length; x++) {
                    vm.edit_product_attributes[x].attribute_values = vm.edit_product_attributes[x].attribute_working_values;
                }
            }
        }

        if (vm.edit_product_attributes) {
            vm.product.product_attributes = JSON.parse(JSON.stringify(vm.edit_product_attributes));
        }

        if (vm.product.product_type != '4') {
            vm.firearm_type = null;
            vm.firearm_manufacturer = null;
            vm.firearm_model = null;
            vm.firearm_caliber_or_gauge = null;
        }
        vm.product.firearm_type = vm.firearm_type;
        vm.product.firearm_manufacturer = vm.firearm_manufacturer;
        vm.product.firearm_model = vm.firearm_model;
        vm.product.firearm_caliber_or_gauge = vm.firearm_caliber_or_gauge;

        // Update Images
        vm.product.images = vm.image_maint.toServerImageArray();

        //todo kld
        //Need to update the vm.product.product_variants structure for UPCS and Prices
        //  Need a way to delete obsolete variants and add in new variants.
        //vm.edit_product_upcs


        // Update Item
        if (vm.item) {
            // Find it in the existing product items.
            for (x = 0; x < vm.product.item_details.length; x++) {
                //Update item_details for the current branch.
                if (vm.product.item_details[x].branch == vm.item.branch) {
                    vm.product.item_details[x].item_tags = vm.item.item_tags;
                    vm.product.item_details[x].buying.supplier = vm.item.buying.supplier;
                    vm.product.item_details[x].buying.supplier_name = vm.item.buying.supplier_name;
                    vm.product.item_details[x].buying.popularity = vm.item.buying.popularity;
                    vm.product.item_details[x].buying.popularity_description = vm.item.buying.popularity_description;
                    vm.product.item_details[x].buying.available_uoms = vm.item.buying.available_uoms;
                    vm.product.item_details[x].buying.purchasing_uom = vm.item.buying.purchasing_uom;
                    vm.product.item_details[x].stocking.available_uoms = vm.item.stocking.available_uoms;
                    vm.product.item_details[x].stocking.is_stocked = vm.item.stocking.is_stocked;
                    vm.product.item_details[x].stocking.track_inventory = vm.item.stocking.track_inventory;
                    vm.product.item_details[x].stocking.bin_locations = vm.item.stocking.bin_locations;
                    vm.product.item_details[x].selling = vm.item.selling;

                    vm.product.item_details[x].buying.suppliers = JSON.parse(JSON.stringify(vm.item.buying.suppliers));
                    // Newly added supplier records need an id to be used by my grid but api needs them set
                    // to null.
                    angular.forEach(vm.product.item_details[x].buying.suppliers, function (supplier) {
                        if (supplier.id < 0) {
                            supplier.id = null;
                        }
                        if (vm.all_inventory_access_obj.access_price_cost && vm.product.price_by === prompt_price_tye) {
                            supplier.replacement_cost = null;
                        }
                    });
                    angular.forEach(vm.product.item_details[x].stocking.bin_locations, function (bin_location) {
                        if (!bin_location.id) {
                            bin_location.id = null;
                        }
                    });
                    angular.forEach(vm.product.item_details[x].item_tags, function (item_tags) {
                        if (!item_tags.id) {
                            item_tags.id = null;
                        }
                    });

                    vm.product.item_details[x].selling.target_gp = vm.item.selling.target_gp;
                    if (vm.all_inventory_access_obj.access_price_cost) {
                        vm.product.item_details[x].prices = [];
                        if (vm.product.price_by != 2) {
                            // Add in the default item level price type
                            if (!vm.selling_price.id) {
                                vm.selling_price.id = null;
                            }

                            //Below code commented and included in update_prices_or_get_unsaved_prices
                            // vm.product.item_details[x].prices.push({
                            //     price_type: vm.system_default_price_type,
                            //     uom: vm.product_selling_uom,
                            //     uom_code: vm.product_selling_uom_name,
                            //     price: parseFloat(vm.selling_price.amount),
                            //     selling_multiple: vm.product_selling_uom_multiple,
                            //     is_default: true,
                            //     is_active: true,
                            //     id: vm.selling_price.id,
                            //     product_price: vm.selling_price.product_price,
                            //     variant: vm.variant_main_value
                            // });
                            // // Add in the alternate item level price types
                            // angular.forEach(vm.alternate_selling_price, function (alternate_price) {
                            //     if (!alternate_price.id || alternate_price.id === alternate_price.product_price) {
                            //         alternate_price.id = null;
                            //     }
                            //     vm.product.item_details[x].prices.push({
                            //         price_type: parseInt(alternate_price.price_type),
                            //         uom: parseInt(alternate_price.selling_price_uom),
                            //         price: parseFloat(alternate_price.selling_item_amount),
                            //         selling_multiple: alternate_price.selling_multiple,
                            //         is_default: false,
                            //         is_active: alternate_price.is_active,
                            //         variant: vm.variant_main_value,
                            //         id: alternate_price.id,
                            //         default_text:alternate_price.default_text,
                            //         product_price: alternate_price.product_price
                            //     });
                            // });

                            vm.update_prices_or_get_unsaved_prices('item_level', x);

                        }
                    }
                    if (vm.all_inventory_access_obj.access_price_cost && vm.all_inventory_access_obj.access_costs_gp_information && vm.product.product_type != '1' && vm.product.product_type != '2') {
                        if (vm.product.item_details[x].costs && vm.product.item_details[x].costs.length > 0) {
                            angular.forEach(vm.product.item_details[x].costs, function (costs) {
                                if (costs.variant == vm.variant_main_value) {
                                    costs.average_cost = vm.item.costs.average_cost;
                                    costs.replacement_cost = vm.item.costs.replacement_cost;
                                    costs.keep_running_cost = vm.item.costs.keep_running_cost;
                                }
                            });

                        }
                        // skip the last_costs, and quantities since they are read only.

                    } else {
                        //Fill variant values
                        //Fill the edit arrays with the current grid values.
                        update_edit_buying_variant_values();
                        update_edit_pricing_variant_values();
                        vm.product.item_details[x].stocking.on_hand_quantities = [];
                        if (vm.all_inventory_access_obj.access_price_cost) {
                            if (vm.all_inventory_access_obj.access_costs_gp_information) {
                                vm.product.item_details[x].costs.replacement_costs = [];
                                if (vm.item.costs.replacement_cost) {
                                    new_value = vm.item.costs.replacement_cost;
                                } else {
                                    new_value = null;
                                }
                                vm.product.item_details[x].costs.replacement_costs.push({
                                    cost: new_value,
                                    variant_value_1: null,
                                    variant_value_2: null,
                                    variant_value_3: null
                                });
                            }
                            var found = false;
                            for (y = 0; vm.edit_pricing_variant_detail.length > y; y++) {
                                if (vm.edit_pricing_variant_detail[y].variant_value_1 != null ||
                                    vm.edit_pricing_variant_detail[y].variant_value_2 != null ||
                                    vm.edit_pricing_variant_detail[y].variant_value_3 != null) {
                                    if (vm.all_inventory_access_obj.access_costs_gp_information) {
                                        vm.product.item_details[x].costs.replacement_costs.push({
                                            variant_value_1: vm.edit_pricing_variant_detail[y].variant_value_1,
                                            variant_value_2: vm.edit_pricing_variant_detail[y].variant_value_2,
                                            variant_value_3: vm.edit_pricing_variant_detail[y].variant_value_3,
                                            cost: vm.edit_pricing_variant_detail[y].replacement_cost
                                        });
                                    }
                                    found = false;
                                    for (z = 0; vm.product.item_details[x].prices.length > z; z++) {
                                        if (vm.product.item_details[x].prices[z].is_default == true &&
                                            vm.product.item_details[x].prices[z].variant_value_1 == vm.edit_pricing_variant_detail[y].variant_value_1 &&
                                            vm.product.item_details[x].prices[z].variant_value_2 == vm.edit_pricing_variant_detail[y].variant_value_2 &&
                                            vm.product.item_details[x].prices[z].variant_value_3 == vm.edit_pricing_variant_detail[y].variant_value_3) {
                                            vm.product.item_details[x].prices[z].price = vm.edit_pricing_variant_detail[y].selling_price;
                                            found = true;
                                        }
                                    }

                                    if (found == false) {
                                        if (vm.selling_price.price_type && vm.selling_price.selling_price_uom) {
                                            // only set prices if the Store Selling Price has been set.
                                            if (vm.edit_pricing_variant_detail[y].selling_price != null) {
                                                vm.product.item_details[x].prices.push({
                                                    price_type: parseInt(vm.selling_price.price_type),
                                                    uom: parseInt(vm.selling_price.selling_price_uom),
                                                    price: vm.edit_pricing_variant_detail[y].selling_price,
                                                    is_default: true,
                                                    variant_value_1: vm.edit_pricing_variant_detail[y].variant_value_1,
                                                    variant_value_2: vm.edit_pricing_variant_detail[y].variant_value_2,
                                                    variant_value_3: vm.edit_pricing_variant_detail[y].variant_value_3
                                                });
                                            }

                                        }

                                    }

                                }
                            }
                        }
                    }

                } else {
                    if (vm.all_inventory_access_obj.access_price_cost) {
                        //Update the item_details for other branches which are not currently displayed.
                        if (vm.product.price_by == 2) {
                            //Clear out the item pricing since it is kept at store level.
                            vm.product.item_details[x].prices = [];
                        }
                        if (vm.product.price_by != 2) {
                            if (vm.product.price_by === prompt_price_tye) {
                                angular.forEach(vm.product.item_details[x].buying.suppliers, function (supplier) {
                                    supplier.replacement_cost = null;

                                });
                            }
                            if (vm.prev_price_by == 3) {
                                /*For first change from "Prompt for price" to "By Store"
                                Copy all the price from current store to all other stores*/

                                if (vm.product.item_details[x].prices.length === 0) {
                                    vm.product.item_details[x].prices.push({
                                        price_type: vm.system_default_price_type,
                                        uom: vm.product_selling_uom,
                                        uom_code: vm.product_selling_uom_name,
                                        price: vm.selling_price.amount !== null ? parseFloat(vm.selling_price.amount) : null,
                                        selling_multiple: vm.product_selling_uom_multiple,
                                        is_default: true,
                                        is_active: true,
                                        id: null,
                                        product_price: vm.selling_price.product_price,
                                        variant: vm.variant_main_value
                                    });
                                }

                                let default_price = vm.product.item_details[x].prices.filter(i => i.is_default === true && i.is_active === true)[0];
                                if (default_price.price === null) {
                                    default_price.price = parseFloat(vm.selling_price.amount);
                                }
                            }

                            if (vm.current_price_by == 2) {
                                // Switched from kept by system to kept by store.  Now copy this system price into each item.
                                vm.product.item_details[x].selling.target_gp = vm.item.selling.target_gp;
                                vm.product.item_details[x].prices = [];
                                vm.product.item_details[x].prices.push({
                                    price_type: vm.selling_price.price_type,
                                    uom: vm.selling_price.selling_price_uom,
                                    uom_code: vm.selling_price.selling_price_uom_name,
                                    price: vm.selling_price.product_amount,
                                    selling_multiple: vm.selling_price.selling_multiple,
                                    is_default: true,
                                    //is_active: vm.selling_price.is_active,
                                    is_active: true, //Sharad - The first push we are making into price id bydefaul true for is_active and is_default please reffer 1381
                                    id: vm.selling_price.id,
                                    product_price: vm.selling_price.product_price
                                });

                                angular.forEach(vm.alternate_unit_grid_data_source.data().toJSON(), function (alternate_price) {
                                    vm.product.item_details[x].prices.push({
                                        price_type: parseInt(alternate_price.price_type),
                                        uom: alternate_price.selling_price_uom ? alternate_price.selling_price_uom : alternate_price.uom,
                                        price: parseFloat(alternate_price.price),
                                        selling_multiple: alternate_price.selling_multiple,
                                        is_default: false,
                                        is_active: true,
                                        //variant: vm.variant_main_value,
                                        id: alternate_price.id ? alternate_price.id : null,
                                        default_text: alternate_price.default_text,
                                        product_price: alternate_price.product_price ? alternate_price.product_price : null,

                                        //Newly added keys for grid implementation for alternate units
                                        discount_off_retail_percent: alternate_price.price_method === 1 ? alternate_price.markup_price : null,
                                        markup_from_retail_percent: alternate_price.price_method === 2 ? alternate_price.markup_price : null,
                                        markup_price: alternate_price.markup_price,
                                        newly_added: alternate_price.newly_added,
                                        price_method_name: alternate_price.price_method_name,
                                        product_gross_profit: alternate_price.product_gross_profit,
                                        rounding_method: alternate_price.rounding_method,
                                        rounding_method_name: alternate_price.rounding_method_name,
                                        selling_product_amount: alternate_price.selling_product_amount,
                                        stocking_price_uom_name: alternate_price.stocking_price_uom_name,
                                        price_method: alternate_price.price_method,
                                        selling_price_uom_name: alternate_price.selling_price_uom_name,
                                        temp_id: alternate_price.temp_id
                                    });
                                });
                            } else {
                                const _check_add_price = function (alternate_price) {
                                    let add_price = true;
                                    let price_list = vm.product.item_details[x].prices;
                                    for (let i = 0; i < price_list.length; i++) {
                                        if (price_list[i].default_text === alternate_price.default_text && price_list[i].uom === alternate_price.uom && alternate_price.price_changed) {
                                            vm.product.item_details[x].prices[i].price = alternate_price.price;
                                            alternate_price.price_changed = false;
                                        }

                                        if (price_list[i].default_text === alternate_price.default_text && price_list[i].uom === alternate_price.uom) {
                                            add_price = false;
                                            break;
                                        }
                                    }
                                    return add_price;
                                };

                                /*
                                    Some of the fields are same for all stores so copy from current store to other store.
                                 */
                                const _copy_common_fields = function (alternate_price) {
                                    let price_list = vm.product.item_details[x].prices;
                                    let copy_object = {}, product_price, temp_price;
                                    for (let i = 0; i < price_list.length; i++) {
                                        product_price = price_list[i].product_price ? 'product_price' : 'temp_id';
                                        if (!price_list[i].is_default && price_list[i][product_price] === alternate_price[product_price]) {
                                            copy_object = {};
                                            //Different for different stores, so copy that stores own values.
                                            // Do not the values from Grid (Current item)
                                            temp_price = angular.copy(price_list[i]);
                                            copy_object = angular.copy(alternate_price);
                                            copy_object.price = price_list[i].price;
                                            copy_object.rounding_method = price_list[i].rounding_method;
                                            copy_object.rounding_method_name = price_list[i].rounding_method_name;
                                            copy_object.discount_off_retail_percent = price_list[i].discount_off_retail_percent;
                                            copy_object.markup_from_retail_percent = price_list[i].markup_from_retail_percent;
                                            //Consider the changed value instead of getting from price[i], as user may have changed markup price in grid
                                            if (price_list[i].price_method == 1 && price_list[i].markup_price) {
                                                copy_object.discount_off_retail_percent = price_list[i].markup_price;
                                            } else if (price_list[i].price_method == 2 && price_list[i].markup_price) {
                                                copy_object.markup_from_retail_percent = price_list[i].markup_price;
                                            }
                                            copy_object.markup_price = price_list[i].markup_price;
                                            copy_object.price_method = price_list[i].price_method;
                                            copy_object.price_method_name = price_list[i].price_method_name;
                                            price_list[i] = copy_object;
                                            price_list[i].id = temp_price.id;
                                            price_list[i].product_price = temp_price.product_price;
                                        }
                                    }
                                };

                                const _price_already_existing = function (alternate_price) {
                                    let price_list = vm.product.item_details[x].prices, exists = false;
                                    for (let i = 0; i < price_list.length; i++) {
                                        if (price_list[i].temp_id === alternate_price.temp_id) {
                                            exists = true;
                                            break;
                                        }
                                    }
                                    return exists;
                                };

                                angular.forEach(vm.alternate_unit_grid_data_source.data().toJSON(), function (alternate_price) {
                                    //let add_price = _check_add_price(alternate_price);
                                    //&& _check_add_price(alternate_price)
                                    if (alternate_price.newly_added && !_price_already_existing(alternate_price)) {
                                        vm.product.item_details[x].prices.push({
                                            price_type: parseInt(alternate_price.price_type),
                                            uom: alternate_price.selling_price_uom ? alternate_price.selling_price_uom : alternate_price.uom,
                                            //price: alternate_price.selling_item_amount,
                                            price: parseFloat(alternate_price.price),
                                            selling_multiple: alternate_price.selling_multiple,
                                            is_default: false,
                                            is_active: alternate_price.is_active,
                                            id: alternate_price.id ? alternate_price.id : null,
                                            default_text: alternate_price.default_text,
                                            product_price: alternate_price.product_price ? alternate_price.product_price : null,

                                            //Newly added keys for grid implementation for alternate units
                                            discount_off_retail_percent: alternate_price.price_method === 1 ? alternate_price.markup_price : null,
                                            markup_from_retail_percent: alternate_price.price_method === 2 ? alternate_price.markup_price : null,
                                            markup_price: alternate_price.markup_price,
                                            newly_added: false,
                                            price_method_name: alternate_price.price_method_name,
                                            product_gross_profit: alternate_price.product_gross_profit,
                                            rounding_method: alternate_price.rounding_method,
                                            rounding_method_name: alternate_price.rounding_method_name,
                                            selling_product_amount: alternate_price.selling_product_amount,
                                            stocking_price_uom_name: alternate_price.stocking_price_uom_name,
                                            price_method: alternate_price.price_method,
                                            selling_price_uom_name: alternate_price.selling_price_uom_name,
                                            temp_id: alternate_price.temp_id
                                        });
                                    }

                                    if (!alternate_price.hasOwnProperty('discount_off_retail_percent')) {
                                        if (alternate_price.price_method === 1) {
                                            alternate_price.discount_off_retail_percent = alternate_price.markup_price;
                                        }
                                    }

                                    if (!alternate_price.hasOwnProperty('markup_from_retail_percent')) {
                                        if (alternate_price.price_method === 2) {
                                            alternate_price.markup_from_retail_percent = alternate_price.markup_price;
                                        }
                                    }

                                    _copy_common_fields(alternate_price);
                                });

                                // angular.forEach(vm.alternate_unit_grid_data_source.data().toJSON(), function (alternate_price) {
                                //     if (alternate_price.newly_added) {
                                //         vm.product.item_details[x].prices.push({
                                //             price_type: parseInt(alternate_price.price_type),
                                //             uom: parseInt(alternate_price.selling_price_uom),
                                //             price: alternate_price.selling_item_amount,
                                //             selling_multiple: alternate_price.selling_multiple,
                                //             is_default: false,
                                //             is_active: true,
                                //             id: alternate_price.id,
                                //             product_price: alternate_price.product_price
                                //         });
                                //     }
                                // });
                                // // Now remove any that were deleted from the item level for the other stores
                                // if (vm.alternate_deleted_price && vm.alternate_deleted_price.length > 0) {
                                //     angular.forEach(vm.alternate_deleted_price, function (deleted_price) {
                                //         if (deleted_price.newly_added == false) {
                                //             for (z = 0; z < vm.product.item_details[x].prices.length; z++) {
                                //                 if (vm.product.item_details[x].prices[z].product_price == deleted_price.product_price) {
                                //                     vm.product.item_details[x].prices.splice(z, 1);
                                //                 }
                                //             }
                                //         }
                                //     });
                                // }
                            }

                        }

                    }
                }
            }
            vm.current_price_by = vm.product.price_by;
        }

        if (vm.all_inventory_access_obj.access_price_cost && vm.refresh_calculations_when_store_changes) {
            _update_current_store_calculations();
        }

        //get original default price id if continously changed from "Same for all store" and "By Store/Location"/vice-versa
        if (vm.all_inventory_access_obj.access_price_cost) {
            if (vm.product.price_by === 0) {
                add_default_price_id();
            }
        }

        //If the price is by location then call the new function .
        //This function will go through all the item details array and update the original price id stored in the map.
        if (vm.product.price_by === 0) {
            // fill_price_by_location();
        }
    };

    //Adds back the main price id from the map, not Alternate Units
    function add_default_price_id() {
        vm.product.item_details.forEach(function (item) {
            if (item.id) {
                for (var i = 0; i < item.prices.length; i++) {
                    if (item.prices[i].is_default && item.prices[i].is_active && !item.prices[i].id) {
                        item.prices[i].id = vm.price_by_location_price_map[item.id] ? vm.price_by_location_price_map[item.id] : null;
                        item.prices[i].variant = vm.variant_main_value;
                    }
                }
            } else {
                for (var i = 0; i < item.prices.length; i++) {
                    if (item.prices[i].is_default && item.prices[i].is_active && !item.prices[i].id) {
                        item.prices[i].variant = vm.variant_main_value;
                    }
                }
            }
        });
    };

    /*
        When switching between stores in case of alternate selling units, this methos will be calling the api to get the latest calculations depensding on the present values in the grid/prices array
     */
    const _update_current_store_calculations = function () {
        let item_details = vm.product.item_details;
        let selected_branch_price = [], current_store_price_index;
        for (let i = 0; i < item_details.length; i++) {
            if (item_details[i].branch === vm.selected_branch_id) {
                current_store_price_index = i;
                selected_branch_price = item_details[i].prices.filter(function (price) {
                    return !price.is_default;
                });
                break;
            }
        }

        selected_branch_price.forEach(function (non_default_price) {
            if (non_default_price.price_method == 1) {
                non_default_price.markup_price = non_default_price.discount_off_retail_percent;
            } else if (non_default_price.price_method == 2) {
                non_default_price.markup_price = non_default_price.markup_from_retail_percent;
            } else {
                non_default_price.markup_price = 0;
            }
        });

        let default_price_record = item_details[current_store_price_index].prices.filter(function (price) {
            return price.is_default === true;
        });

        if (default_price_record.length > 0) {
            vm.selling_price.amount = default_price_record[0].price;
        }

        if (selected_branch_price.length > 0) {
            _get_latest_price_gp_percentage(selected_branch_price, function (error, response) {
                let alternate_unit, calculated_data = response.data;
                for (let index = 0; index < calculated_data.length; index++) {
                    alternate_unit = _search_unique_alternate_unit(item_details[current_store_price_index].prices, calculated_data[index].price_type_id, calculated_data[index].uom_id);
                    //alternate_unit.price = (alternate_unit.price_type == vm.system_default_price_type) ? (vm.selling_price.amount *  alternate_unit.selling_multiple) : calculated_data[index].alternate_price;
                    alternate_unit.price = calculated_data[index].alternate_price;
                    alternate_unit.product_gross_profit = calculated_data[index].gp ? calculated_data[index].gp : '0';
                }
                _refresh_alternate_grid();
            });
        }
    };


    /*
        This method fills price when pricing method is "by location"
     */
    function fill_price_by_location() {
        vm.product.item_details.forEach(function (item) {
            if (item.id) {
                for (var i = 0; i < item.prices.length; i++) {
                    if (item.prices[i].is_default && item.prices[i].is_active && i === 0 && !item.prices[i].id) {
                        item.prices[i].id = vm.price_by_location_price_map[item.id] ? vm.price_by_location_price_map[item.id] : null;
                        item.prices[i].variant = vm.variant_main_value;
                    }

                    //For alternate price if id is null then add it
                    if (i > 0 && !item.prices[i].id) {
                        item.prices[i].id = vm.alternate_price_by_location_map[item.id] ? vm.alternate_price_by_location_map[item.id][i] : null;
                    }
                }
            } else {
                for (var i = 0; i < item.prices.length; i++) {
                    if (item.prices[i].is_default && item.prices[i].is_active && i === 0 && !item.prices[i].id) {
                        item.prices[i].variant = vm.variant_main_value;
                    }
                }
            }
        });
    };

    function create_empty_edit_buying_variant_values_structure() {

        vm.edit_buying_variant_detail = [];
        var x, y, z;
        if (vm.edit_product_attributes.length > 0) {

            if (vm.edit_product_attributes.length == 1) {
                for (x = 0; vm.edit_product_attributes[0].attribute_values.length > x; x++) {
                    vm.edit_buying_variant_detail.push({
                        variant_value_1: vm.edit_product_attributes[0].attribute_values[x].id,
                        variant_value_2: null,
                        variant_value_3: null,
                        order_point: null,
                        max_quantity: null,
                        qoh: null,
                        qoo: null,
                        qav: null
                    });

                }
            }
            if (vm.edit_product_attributes.length == 2) {
                for (x = 0; vm.edit_product_attributes[0].attribute_values.length > x; x++) {
                    for (y = 0; vm.edit_product_attributes[1].attribute_values.length > y; y++) {
                        vm.edit_buying_variant_detail.push({
                            variant_value_1: vm.edit_product_attributes[0].attribute_values[x].id,
                            variant_value_2: vm.edit_product_attributes[1].attribute_values[y].id,
                            variant_value_3: null,
                            order_point: null,
                            max_quantity: null,
                            qoh: null,
                            qoo: null,
                            qav: null
                        });
                    }
                }
            }

            if (vm.edit_product_attributes.length == 3) {
                for (x = 0; vm.edit_product_attributes[0].attribute_values.length > x; x++) {
                    for (y = 0; vm.edit_product_attributes[1].attribute_values.length > y; y++) {
                        for (z = 0; vm.edit_product_attributes[2].attribute_values.length > z; z++) {
                            vm.edit_buying_variant_detail.push({
                                variant_value_1: vm.edit_product_attributes[0].attribute_values[x].id,
                                variant_value_2: vm.edit_product_attributes[1].attribute_values[y].id,
                                variant_value_3: vm.edit_product_attributes[2].attribute_values[z].id,
                                order_point: null,
                                max_quantity: null,
                                qoh: null,
                                qoo: null,
                                qav: null
                            });
                        }
                    }
                }
            }
        }
    }

    function create_empty_edit_pricing_variant_values_structure() {
        vm.edit_pricing_variant_detail = [];
        var x, y, z;

        if (vm.edit_product_attributes.length > 0) {

            if (vm.edit_product_attributes.length == 1) {
                for (x = 0; vm.edit_product_attributes[0].attribute_values.length > x; x++) {
                    vm.edit_pricing_variant_detail.push({
                        variant_value_1: vm.edit_product_attributes[0].attribute_values[x].id,
                        variant_value_2: null,
                        variant_value_3: null,
                        replacement_cost: null,
                        selling_price: null
                    });

                }
            }
            if (vm.edit_product_attributes.length == 2) {
                for (x = 0; vm.edit_product_attributes[0].attribute_values.length > x; x++) {
                    for (y = 0; vm.edit_product_attributes[1].attribute_values.length > y; y++) {
                        vm.edit_pricing_variant_detail.push({
                            variant_value_1: vm.edit_product_attributes[0].attribute_values[x].id,
                            variant_value_2: vm.edit_product_attributes[1].attribute_values[y].id,
                            variant_value_3: null,
                            replacement_cost: null,
                            selling_price: null
                        });
                    }
                }
            }

            if (vm.edit_product_attributes.length == 3) {
                for (x = 0; vm.edit_product_attributes[0].attribute_values.length > x; x++) {
                    for (y = 0; vm.edit_product_attributes[1].attribute_values.length > y; y++) {
                        for (z = 0; vm.edit_product_attributes[2].attribute_values.length > z; z++) {
                            vm.edit_pricing_variant_detail.push({
                                variant_value_1: vm.edit_product_attributes[0].attribute_values[x].id,
                                variant_value_2: vm.edit_product_attributes[1].attribute_values[y].id,
                                variant_value_3: vm.edit_product_attributes[2].attribute_values[z].id,
                                replacement_cost: null,
                                selling_price: null
                            });
                        }
                    }

                }
            }

        }

    }

    function add_variant_value_to_structure(variant_attribute, variant_id) {
        // User added a value to one of the variant attributes so update the structure
        // used to build the grids.
        var add_field_value = null;
        var loop_1 = null;
        var loop_2 = null;
        var value_1 = null;
        var value_2 = null;
        var value_3 = null;
        var field_1_values = [];
        var field_2_values = [];
        var field_3_values = [];
        var new_value_place = 0;
        for (var x = 0; vm.edit_product_attributes.length > x; x++) {
            if (vm.edit_product_attributes[x].attribute == variant_attribute) {
                add_field_value = x;
            } else {
                if (loop_1 == null) {
                    loop_1 = x;
                } else {
                    loop_2 = x;
                }
            }
        }
        if (add_field_value != null) {
            if (loop_1 != null) {
                for (x = 0; vm.edit_product_attributes[loop_1].attribute_working_values.length > x; x++) {
                    if (loop_2 != null) {
                        for (var y = 0; vm.edit_product_attributes[loop_2].attribute_working_values.length > y; y++) {
                            if (loop_1 == 1) {
                                value_1 = variant_id;
                                value_2 = vm.edit_product_attributes[loop_1].attribute_working_values[x].id;
                                value_3 = vm.edit_product_attributes[loop_2].attribute_working_values[y].id;
                                new_value_place = 1;
                            } else {
                                if (loop_2 == 1) {
                                    value_1 = vm.edit_product_attributes[loop_1].attribute_working_values[x].id;
                                    value_2 = vm.edit_product_attributes[loop_2].attribute_working_values[y].id;
                                    value_3 = variant_id;
                                    new_value_place = 3;
                                } else {
                                    value_1 = vm.edit_product_attributes[loop_1].attribute_working_values[x].id;
                                    value_2 = variant_id;
                                    value_3 = vm.edit_product_attributes[loop_2].attribute_working_values[y].id;
                                    new_value_place = 2;
                                }
                            }
                            add_variant_detail(value_1, value_2, value_3, new_value_place);
                            field_1_values.push(value_1);
                            field_2_values.push(value_2);
                            field_3_values.push(value_3);
                        }
                    } else {
                        if (loop_1 == 0) {
                            value_1 = vm.edit_product_attributes[loop_1].attribute_working_values[x].id;
                            value_2 = variant_id;
                            field_1_values.push(value_1);
                            field_2_values.push(variant_id);
                            new_value_place = 2;
                        } else {
                            value_2 = vm.edit_product_attributes[loop_1].attribute_working_values[x].id;
                            value_1 = variant_id;
                            field_2_values.push(value_2);
                            field_1_values.push(value_1);
                            new_value_place = 1;
                        }
                        add_variant_detail(value_1, value_2, value_3, new_value_place);
                    }
                }
            } else {
                // only one variant defined
                new_value_place = 1;
                add_variant_detail(variant_id, null, null, new_value_place);
                field_1_values.push(variant_id);
            }
            add_variant_value_to_entire_product(field_1_values, field_2_values, field_3_values);
        }
    }

    function add_variant_detail(variant_1, variant_2, variant_3, placement) {
        var add_new = true;
        if (vm.edit_buying_variant_detail == null) {
            vm.edit_buying_variant_detail = [];
            vm.edit_pricing_variant_detail = [];
        }
        // Structure could already have existed with null value in place where this new value is added.  Try to use
        // that record first before adding a new record and creating an orphan record.
        for (var x = 0; vm.edit_buying_variant_detail.length > x; x++) {
            if (vm.edit_buying_variant_detail[x].variant_value_1 == null && placement == 1) {
                // Update this spot to have the new variant value
                vm.edit_buying_variant_detail[x].variant_value_1 = variant_1;
                vm.edit_pricing_variant_detail[x].variant_value_1 = variant_1;
                add_new = false;
            }
            if (vm.edit_buying_variant_detail[x].variant_value_2 == null && placement == 2) {
                vm.edit_buying_variant_detail[x].variant_value_2 = variant_2;
                vm.edit_pricing_variant_detail[x].variant_value_2 = variant_2;
                add_new = false;
            }
            if (vm.edit_buying_variant_detail[x].variant_value_3 == null && placement == 3) {
                vm.edit_buying_variant_detail[x].variant_value_3 = variant_3;
                vm.edit_pricing_variant_detail[x].variant_value_3 = variant_3;
                add_new = false;
            }
        }

        if (add_new) {
            vm.edit_buying_variant_detail.push({
                variant_value_1: variant_1,
                variant_value_2: variant_2,
                variant_value_3: variant_3,
                max_quantity: null,
                order_point: null,
                qav: null,
                qoo: null,
                qoh: null
            });
            vm.edit_pricing_variant_detail.push({
                variant_value_1: variant_1,
                variant_value_2: variant_2,
                variant_value_3: variant_3,
                average_cost: null,
                last_received_cost: null,
                replacement_cost: null,
                selling_price: null
            });
        }
    }

    function add_variant_value_to_entire_product(field_1_values, field_2_values, field_3_values) {
        //user added an attribute value.  Now loop through all stores to add that variant value
        // to each of the fields we keep at the variant level.  We are passed lists of the variant
        // ids for each of the variant fields in the correct order.
        var value_1;
        var value_2;
        var value_3;
        for (var a = 0; field_1_values.length > a; a++) {
            value_1 = field_1_values[a];
            value_2 = null;
            value_3 = null;
            if (field_2_values.length > 0) {
                for (var b = 0; field_2_values.length > b; b++) {
                    value_2 = field_2_values[b];
                    value_3 = null;
                    if (field_3_values.length > 0) {
                        for (var c = 0; field_3_values.length > c; c++) {
                            value_3 = field_3_values[c];
                            add_product_variants(value_1, value_2, value_3);
                        }
                    } else {
                        add_product_variants(value_1, value_2, value_3);
                    }
                }
            } else {
                add_product_variants(value_1, value_2, value_3);
            }
        }
    }

    function add_product_variants(value_1, value_2, value_3) {

        for (var x = 0; vm.product.item_details.length > x; x++) {
            if (vm.is_item_displayed && vm.product.item_details[x].id == vm.item.id) {
                //skip it
            } else {
                vm.product.item_details[x].costs.push({
                    variant_value_1: value_1,
                    variant_value_2: value_2,
                    variant_value_3: value_3,
                    average_cost: null,
                    last_cost: null,
                    replacement_cost: null
                });
                vm.product.item_details[x].stocking.lots.push({
                    variant_value_1: value_1,
                    variant_value_2: value_2,
                    variant_value_3: value_3,
                    qty_on_hand: null,
                    qty_on_order: null,
                    qty_committed: null,
                    qty_available: null
                });
            }
        }
    }

    function remove_variant_value_from_structure(removed_attribute, removed_id) {
        // User removed one of the values of a variant attribute so update the structure
        // used to build the grids.
        var x;
        var new_structure = [];
        var add_record = true;
        var last_value = false;
        // Find out if this is the only value left for an attribute.
        for (x = 0; vm.edit_product_attributes.length > x; x++) {
            if (vm.edit_product_attributes[x].attribute == removed_attribute) {
                if (vm.edit_product_attributes[x].attribute_working_values.length == 0) {
                    // This is the last value for a attribute. Instead of just removing the value, need to null it
                    // out.
                    last_value = true;
                }
            }
        }

        if (vm.edit_buying_variant_detail && vm.edit_buying_variant_detail.length > 0) {

            for (x = 0; vm.edit_buying_variant_detail.length > x; x++) {
                add_record = true;
                if (last_value) {
                    if (vm.edit_buying_variant_detail[x].variant_value_1 == removed_id) {
                        vm.edit_buying_variant_detail[x].variant_value_1 = null;
                    }
                    if (vm.edit_buying_variant_detail[x].variant_value_2 == removed_id) {
                        vm.edit_buying_variant_detail[x].variant_value_2 = null;
                    }
                    if (vm.edit_buying_variant_detail[x].variant_value_3 == removed_id) {
                        vm.edit_buying_variant_detail[x].variant_value_3 = null;
                    }
                } else {
                    if (vm.edit_buying_variant_detail[x].variant_value_1 == removed_id ||
                        vm.edit_buying_variant_detail[x].variant_value_2 == removed_id ||
                        vm.edit_buying_variant_detail[x].variant_value_3 == removed_id) {
                        add_record = false;
                    }
                }

                if (add_record) {
                    new_structure.push({
                        variant_value_1: vm.edit_buying_variant_detail[x].variant_value_1,
                        variant_value_2: vm.edit_buying_variant_detail[x].variant_value_2,
                        variant_value_3: vm.edit_buying_variant_detail[x].variant_value_3,
                        max_quantity: vm.edit_buying_variant_detail[x].max_quantity,
                        order_point: vm.edit_buying_variant_detail[x].order_point,
                        qav: vm.edit_buying_variant_detail[x].qav,
                        qoo: vm.edit_buying_variant_detail[x].qoo,
                        qoh: vm.edit_buying_variant_detail[x].qoh
                    });
                }
            }
            vm.edit_buying_variant_detail = JSON.parse(JSON.stringify(new_structure));
        }
        if (vm.edit_pricing_variant_detail && vm.edit_pricing_variant_detail.length > 0) {
            new_structure = [];

            for (x = 0; vm.edit_pricing_variant_detail.length > x; x++) {
                add_record = true;
                if (last_value) {
                    if (vm.edit_pricing_variant_detail[x].variant_value_1 == removed_id) {
                        vm.edit_pricing_variant_detail[x].variant_value_1 = null;
                    }
                    if (vm.edit_pricing_variant_detail[x].variant_value_2 == removed_id) {
                        vm.edit_pricing_variant_detail[x].variant_value_2 = null;
                    }
                    if (vm.edit_pricing_variant_detail[x].variant_value_3 == removed_id) {
                        vm.edit_pricing_variant_detail[x].variant_value_3 = null;
                    }
                } else {
                    if (vm.edit_pricing_variant_detail[x].variant_value_1 == removed_id ||
                        vm.edit_pricing_variant_detail[x].variant_value_2 == removed_id ||
                        vm.edit_pricing_variant_detail[x].variant_value_3 == removed_id) {
                        add_record = false;
                    }
                }

                if (add_record) {
                    new_structure.push({
                        variant_value_1: vm.edit_pricing_variant_detail[x].variant_value_1,
                        variant_value_2: vm.edit_pricing_variant_detail[x].variant_value_2,
                        variant_value_3: vm.edit_pricing_variant_detail[x].variant_value_3,
                        average_cost: vm.edit_pricing_variant_detail[x].average_cost,
                        last_received_cost: vm.edit_pricing_variant_detail[x].last_received_cost,
                        replacement_cost: vm.edit_pricing_variant_detail[x].replacement_cost,
                        selling_price: vm.edit_pricing_variant_detail[x].selling_price

                    });
                }

            }

            vm.edit_pricing_variant_detail = JSON.parse(JSON.stringify(new_structure));

        }

        remove_variant_value_from_entire_product(removed_id, last_value);
    }

    function remove_variant_value_from_entire_product(removed_id, last_value) {
        // Each product can have several item records.  Need to loop through all of them and
        // remove the variant value from each variant field in the structure.
        // If last_value = true, need to null out the specific variant_value.
        var x;
        var y;
        for (x = 0; vm.product.item_details.length > x; x++) {
            if (vm.is_item_displayed && vm.product.item_details[x].id == vm.item.id) {
                //skip it
            } else {
                // buying.order_points
                for (y = vm.product.item_details[x].buying.order_points.length; y--;) {
                    if (last_value) {
                        if (vm.product.item_details[x].buying.order_points[y].variant_value_1 == removed_id) {
                            vm.product.item_details[x].buying.order_points[y].variant_value_1 = null;
                        }
                        if (vm.product.item_details[x].buying.order_points[y].variant_value_2 == removed_id) {
                            vm.product.item_details[x].buying.order_points[y].variant_value_2 = null;
                        }
                        if (vm.product.item_details[x].buying.order_points[y].variant_value_3 == removed_id) {
                            vm.product.item_details[x].buying.order_points[y].variant_value_3 = null;
                        }

                    } else {
                        if (vm.product.item_details[x].buying.order_points[y].variant_value_1 == removed_id ||
                            vm.product.item_details[x].buying.order_points[y].variant_value_2 == removed_id ||
                            vm.product.item_details[x].buying.order_points[y].variant_value_3 == removed_id) {
                            vm.product.item_details[x].buying.order_points.splice(y, 1);
                        }
                    }
                }
                // buying.max_quantities
                for (y = vm.product.item_details[x].buying.max_quantities.length; y--;) {
                    if (last_value) {
                        if (vm.product.item_details[x].buying.max_quantities[y].variant_value_1 == removed_id) {
                            vm.product.item_details[x].buying.max_quantities[y].variant_value_1 = null;
                        }
                        if (vm.product.item_details[x].buying.max_quantities[y].variant_value_2 == removed_id) {
                            vm.product.item_details[x].buying.max_quantities[y].variant_value_2 = null;
                        }
                        if (vm.product.item_details[x].buying.max_quantities[y].variant_value_3 == removed_id) {
                            vm.product.item_details[x].buying.max_quantities[y].variant_value_3 = null;
                        }

                    } else {
                        if (vm.product.item_details[x].buying.max_quantities[y].variant_value_1 == removed_id ||
                            vm.product.item_details[x].buying.max_quantities[y].variant_value_2 == removed_id ||
                            vm.product.item_details[x].buying.max_quantities[y].variant_value_3 == removed_id) {
                            vm.product.item_details[x].buying.max_quantities.splice(y, 1);
                        }
                    }
                }
                if (vm.product.item_details[x].stocking) {
                    if (vm.product.item_details[x].stocking.average_costs.length > 0) {
                        // stocking.average_costs
                        for (y = vm.product.item_details[x].stocking.average_costs.length; y--;) {
                            if (last_value) {
                                if (vm.product.item_details[x].stocking.average_costs[y].variant_value_1 == removed_id) {
                                    vm.product.item_details[x].stocking.average_costs[y].variant_value_1 = null;
                                }
                                if (vm.product.item_details[x].stocking.average_costs[y].variant_value_2 == removed_id) {
                                    vm.product.item_details[x].stocking.average_costs[y].variant_value_2 = null;
                                }
                                if (vm.product.item_details[x].stocking.average_costs[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.average_costs[y].variant_value_3 = null;
                                }

                            } else {
                                if (vm.product.item_details[x].stocking.average_costs[y].variant_value_1 == removed_id ||
                                    vm.product.item_details[x].stocking.average_costs[y].variant_value_2 == removed_id ||
                                    vm.product.item_details[x].stocking.average_costs[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.average_costs.splice(y, 1);
                                }
                            }
                        }
                    }
                    if (vm.product.item_details[x].stocking.last_costs.length > 0) {
                        // stocking.last_costs
                        for (y = vm.product.item_details[x].stocking.last_costs.length; y--;) {
                            if (last_value) {
                                if (vm.product.item_details[x].stocking.last_costs[y].variant_value_1 == removed_id) {
                                    vm.product.item_details[x].stocking.last_costs[y].variant_value_1 = null;
                                }
                                if (vm.product.item_details[x].stocking.last_costs[y].variant_value_2 == removed_id) {
                                    vm.product.item_details[x].stocking.last_costs[y].variant_value_2 = null;
                                }
                                if (vm.product.item_details[x].stocking.last_costs[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.last_costs[y].variant_value_3 = null;
                                }

                            } else {
                                if (vm.product.item_details[x].stocking.last_costs[y].variant_value_1 == removed_id ||
                                    vm.product.item_details[x].stocking.last_costs[y].variant_value_2 == removed_id ||
                                    vm.product.item_details[x].stocking.last_costs[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.last_costs.splice(y, 1);
                                }
                            }
                        }
                    }
                    if (vm.product.item_details[x].stocking.on_hand_quantities.length > 0) {
                        // stocking.on_hand_quantities
                        for (y = vm.product.item_details[x].stocking.on_hand_quantities.length; y--;) {
                            if (last_value) {
                                if (vm.product.item_details[x].stocking.on_hand_quantities[y].variant_value_1 == removed_id) {
                                    vm.product.item_details[x].stocking.on_hand_quantities[y].variant_value_1 = null;
                                }
                                if (vm.product.item_details[x].stocking.on_hand_quantities[y].variant_value_2 == removed_id) {
                                    vm.product.item_details[x].stocking.on_hand_quantities[y].variant_value_2 = null;
                                }
                                if (vm.product.item_details[x].stocking.on_hand_quantities[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.on_hand_quantities[y].variant_value_3 = null;
                                }

                            } else {
                                if (vm.product.item_details[x].stocking.on_hand_quantities[y].variant_value_1 == removed_id ||
                                    vm.product.item_details[x].stocking.on_hand_quantities[y].variant_value_2 == removed_id ||
                                    vm.product.item_details[x].stocking.on_hand_quantities[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.on_hand_quantities.splice(y, 1);
                                }
                            }
                        }
                    }
                    if (vm.product.item_details[x].stocking.on_order_quantities.length > 0) {
                        // stocking.on_order_quantities
                        for (y = vm.product.item_details[x].stocking.on_order_quantities.length; y--;) {
                            if (last_value) {
                                if (vm.product.item_details[x].stocking.on_order_quantities[y].variant_value_1 == removed_id) {
                                    vm.product.item_details[x].stocking.on_order_quantities[y].variant_value_1 = null;
                                }
                                if (vm.product.item_details[x].stocking.on_order_quantities[y].variant_value_2 == removed_id) {
                                    vm.product.item_details[x].stocking.on_order_quantities[y].variant_value_2 = null;
                                }
                                if (vm.product.item_details[x].stocking.on_order_quantities[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.on_order_quantities[y].variant_value_3 = null;
                                }

                            } else {
                                if (vm.product.item_details[x].stocking.on_order_quantities[y].variant_value_1 == removed_id ||
                                    vm.product.item_details[x].stocking.on_order_quantities[y].variant_value_2 == removed_id ||
                                    vm.product.item_details[x].stocking.on_order_quantities[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.on_order_quantities.splice(y, 1);
                                }
                            }
                        }
                    }
                    if (vm.product.item_details[x].stocking.committed_quantities.length > 0) {
                        // stocking.committed_quantities
                        for (y = vm.product.item_details[x].stocking.committed_quantities.length; y--;) {
                            if (last_value) {
                                if (vm.product.item_details[x].stocking.committed_quantities[y].variant_value_1 == removed_id) {
                                    vm.product.item_details[x].stocking.committed_quantities[y].variant_value_1 = null;
                                }
                                if (vm.product.item_details[x].stocking.committed_quantities[y].variant_value_2 == removed_id) {
                                    vm.product.item_details[x].stocking.committed_quantities[y].variant_value_2 = null;
                                }
                                if (vm.product.item_details[x].stocking.committed_quantities[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.committed_quantities[y].variant_value_3 = null;
                                }

                            } else {
                                if (vm.product.item_details[x].stocking.committed_quantities[y].variant_value_1 == removed_id ||
                                    vm.product.item_details[x].stocking.committed_quantities[y].variant_value_2 == removed_id ||
                                    vm.product.item_details[x].stocking.committed_quantities[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.committed_quantities.splice(y, 1);
                                }
                            }
                        }
                    }
                    if (vm.product.item_details[x].stocking.available_quantities.length > 0) {
                        // stocking.available_quantities
                        for (y = vm.product.item_details[x].stocking.available_quantities.length; y--;) {
                            if (last_value) {
                                if (vm.product.item_details[x].stocking.available_quantities[y].variant_value_1 == removed_id) {
                                    vm.product.item_details[x].stocking.available_quantities[y].variant_value_1 = null;
                                }
                                if (vm.product.item_details[x].stocking.available_quantities[y].variant_value_2 == removed_id) {
                                    vm.product.item_details[x].stocking.available_quantities[y].variant_value_2 = null;
                                }
                                if (vm.product.item_details[x].stocking.available_quantities[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.available_quantities[y].variant_value_3 = null;
                                }

                            } else {
                                if (vm.product.item_details[x].stocking.available_quantities[y].variant_value_1 == removed_id ||
                                    vm.product.item_details[x].stocking.available_quantities[y].variant_value_2 == removed_id ||
                                    vm.product.item_details[x].stocking.available_quantities[y].variant_value_3 == removed_id) {
                                    vm.product.item_details[x].stocking.available_quantities.splice(y, 1);
                                }
                            }
                        }
                    }
                }
                // prices
                if (vm.product.item_details[x].prices && vm.product.item_details[x].prices.length > 0) {
                    for (y = vm.product.item_details[x].prices.length; y--;) {
                        if (last_value) {
                            if (vm.product.item_details[x].prices[y].variant_value_1 == removed_id) {
                                vm.product.item_details[x].prices[y].variant_value_1 = null;
                            }
                            if (vm.product.item_details[x].prices[y].variant_value_2 == removed_id) {
                                vm.product.item_details[x].prices[y].variant_value_2 = null;
                            }
                            if (vm.product.item_details[x].prices[y].variant_value_3 == removed_id) {
                                vm.product.item_details[x].prices[y].variant_value_3 = null;
                            }

                        } else {
                            if (vm.product.item_details[x].prices[y].variant_value_1 == removed_id ||
                                vm.product.item_details[x].prices[y].variant_value_2 == removed_id ||
                                vm.product.item_details[x].prices[y].variant_value_3 == removed_id) {
                                vm.product.item_details[x].prices.splice(y, 1);
                            }
                        }
                    }
                }
                // costs.replacement_costs
                if (vm.product.item_details[x].costs && vm.product.item_details[x].costs.replacement_costs) {
                    for (y = vm.product.item_details[x].costs.replacement_costs.length; y--;) {
                        if (last_value) {
                            if (vm.product.item_details[x].costs.replacement_costs[y].variant_value_1 == removed_id) {
                                vm.product.item_details[x].costs.replacement_costs[y].variant_value_1 = null;
                            }
                            if (vm.product.item_details[x].costs.replacement_costs[y].variant_value_2 == removed_id) {
                                vm.product.item_details[x].costs.replacement_costs[y].variant_value_2 = null;
                            }
                            if (vm.product.item_details[x].costs.replacement_costs[y].variant_value_3 == removed_id) {
                                vm.product.item_details[x].costs.replacement_costs[y].variant_value_3 = null;
                            }

                        } else {
                            if (vm.product.item_details[x].costs.replacement_costs[y].variant_value_1 == removed_id ||
                                vm.product.item_details[x].costs.replacement_costs[y].variant_value_2 == removed_id ||
                                vm.product.item_details[x].costs.replacement_costs[y].variant_value_3 == removed_id) {
                                vm.product.item_details[x].costs.replacement_costs.splice(y, 1);
                            }
                        }
                    }
                }
            }
        }
    }

    function update_edit_buying_variant_values() {
        //Fill the edit arrays with the current grid values.
        //Sync the currently unsaved grid values back to the datasource.
        var found = false;
        var y = 0;
        var x_attribute_count = 0;
        // Brand new variants don't have the edit variant data structure.
        if (!vm.edit_buying_variant_detail) {
            create_empty_edit_buying_variant_values_structure();

        }
        if (!vm.edit_pricing_variant_detail) {
            create_empty_edit_pricing_variant_values_structure();
        }
        if (vm.item_buying_variant_data.length > 0) {
            // User changed the variant values ( added or removed some).  Keep any unsaved
            // grid edit changes and re-apply them to the newly updated grid.
            if (vm.edit_product_attributes.length < 2) {
                vm.item_buying_1_variant_grid_data_source.sync();
                angular.forEach(vm.item_buying_variant_data, function (grid_data) {
                    found = false;
                    for (y = 0; vm.edit_buying_variant_detail.length > y; y++) {
                        if (grid_data.variant_value_1 == vm.edit_buying_variant_detail[y].variant_value_1) {
                            found = true;
                            vm.edit_buying_variant_detail[y].order_point = grid_data.order_point;
                            vm.edit_buying_variant_detail[y].max_quantity = grid_data.max_quantity;
                        }
                    }
                    if (found == false) {
                        vm.edit_buying_variant_detail.push({
                            variant_value_1: grid_data.variant_value_1,
                            variant_value_2: null,
                            variant_value_3: null,
                            order_point: grid_data.order_point,
                            max_quantity: grid_data.max_quantity,
                            qoh: grid_data.qoh,
                            qoo: grid_data.qoo,
                            qav: grid_data.qav
                        });
                    }

                });
            } else {
                vm.item_buying_2_variant_grid_data_source.sync();
                if (vm.edit_product_attributes.length == 2) {
                    x_attribute_count = vm.edit_product_attributes[1].attribute_working_values.length;
                    angular.forEach(vm.item_buying_variant_data, function (grid_data) {
                        // Y attribute is the first attribute/attribute listed on the general tab.
                        // X attribute is the second attribute/attribute listed on the general tab.
                        // In this data structure, I have constructed field names for the x_att_id#
                        // that matches the number of x attribute values.  So for one given Y attribute value
                        // I have several x attribute fields ( one for each x attribute value).
                        // Also, each array entry represents a single field (order point, max_qty).  So
                        // there is an array entry per field per Y attribute value.

                        for (y = 0; vm.edit_buying_variant_detail.length > y; y++) {
                            if (vm.edit_buying_variant_detail[y].variant_value_1 == grid_data.y_att_id) {
                                for (var z = 0; x_attribute_count > z; z++) {
                                    var field_name = 'x_att_id' + z.toString();
                                    var field_value_name = 'x_att_val_id' + z.toString();
                                    if (grid_data[field_name]) {
                                        if (grid_data[field_name] == vm.edit_buying_variant_detail[y].variant_value_2) {
                                            if (grid_data.field_id == 0) {
                                                vm.edit_buying_variant_detail[y].order_point = grid_data[field_value_name];
                                            }
                                            if (grid_data.field_id == 1) {
                                                vm.edit_buying_variant_detail[y].max_quantity = grid_data[field_value_name];
                                            }
                                        }
                                    }
                                }

                            }
                        }
                    });


                } else {
                    // 3 attributes
                    //
                    x_attribute_count = vm.edit_product_attributes[2].attribute_working_values.length;
                    angular.forEach(vm.item_buying_variant_data, function (grid_data) {
                        // Y1 attribute is the first attribute/attribute listed on the general tab.
                        // Y2 attribute is the second attribute/attribute listed on the general tab.
                        // X attribute is the third attribute/attribute listed on the general tab.
                        // In this data structure, I have constructed field names for the x_att_id#
                        // that matches the number of x attribute values.  So for one given Y1/Y2 attribute value
                        // combination I have several x attribute fields ( one for each x attribute value).
                        // Also, each array entry represents a single field (order point, max_qty).  So
                        // there is an array entry per field per Y1/Y2 attribute value combination.
                        for (y = 0; vm.edit_buying_variant_detail.length > y; y++) {
                            if (vm.edit_buying_variant_detail[y].variant_value_1 == grid_data.y1_att_id &&
                                vm.edit_buying_variant_detail[y].variant_value_2 == grid_data.y2_att_id) {
                                for (var z = 0; x_attribute_count > z; z++) {
                                    var field_name = 'x_att_id' + z.toString();
                                    var field_value_name = 'x_att_val_id' + z.toString();
                                    if (grid_data[field_name]) {
                                        if (grid_data[field_name] == vm.edit_buying_variant_detail[y].variant_value_3) {
                                            if (grid_data.field_id == 0) {
                                                vm.edit_buying_variant_detail[y].order_point = grid_data[field_value_name];
                                            }
                                            if (grid_data.field_id == 1) {
                                                vm.edit_buying_variant_detail[y].max_quantity = grid_data[field_value_name];
                                            }
                                        }
                                    }
                                }

                            }
                        }
                    });
                }
            }
        }
    }

    function update_edit_pricing_variant_values() {
        //Fill the edit arrays with the current grid values.
        //Sync the currently unsaved grid values back to the datasource.
        var found = false;
        var y = 0;
        var x_attribute_count = 0;

        if (vm.item_pricing_variant_data.length > 0) {
            // User changed the variant values ( added or removed some).  Keep any unsaved
            // grid edit changes and re-apply them to the newly updated grid.
            if (vm.edit_product_attributes.length < 2) {
                vm.item_pricing_1_variant_grid_data_source.sync();
                angular.forEach(vm.item_pricing_variant_data, function (grid_data) {
                    found = false;
                    for (y = 0; vm.edit_pricing_variant_detail.length > y; y++) {
                        if (grid_data.variant_value_1 == vm.edit_pricing_variant_detail[y].variant_value_1) {
                            found = true;
                            vm.edit_pricing_variant_detail[y].replacement_cost = grid_data.replacement_cost;
                            if (grid_data.selling_price == null) {
                                vm.edit_pricing_variant_detail[y].selling_price = vm.selling_price.amount;
                            } else {
                                vm.edit_pricing_variant_detail[y].selling_price = grid_data.selling_price;
                            }
                        }
                    }
                    if (found == false) {
                        vm.edit_pricing_variant_detail.push({
                            variant_value_1: grid_data.variant_value_1,
                            variant_value_2: null,
                            variant_value_3: null,
                            replacement_cost: grid_data.replacement_cost,
                            selling_price: grid_data.selling_price
                        });
                    }

                });
            } else {
                vm.item_pricing_2_variant_grid_data_source.sync();
                if (vm.edit_product_attributes.length == 2) {
                    x_attribute_count = vm.edit_product_attributes[1].attribute_working_values.length;
                    angular.forEach(vm.item_pricing_variant_data, function (grid_data) {
                        // Y attribute is the first attribute/attribute listed on the general tab.
                        // X attribute is the second attribute/attribute listed on the general tab.
                        // In this data structure, I have constructed field names for the x_att_id#
                        // that matches the number of x attribute values.  So for one given Y attribute value
                        // I have several x attribute fields ( one for each x attribute value).
                        // Also, each array entry represents a single field (order point, max_qty).  So
                        // there is an array entry per field per Y attribute value.
                        for (y = 0; vm.edit_pricing_variant_detail.length > y; y++) {
                            if (vm.edit_pricing_variant_detail[y].variant_value_1 == grid_data.y_att_id) {
                                for (var z = 0; x_attribute_count > z; z++) {
                                    var field_name = 'x_att_id' + z.toString();
                                    var field_value_name = 'x_att_val_id' + z.toString();
                                    if (grid_data[field_name]) {
                                        if (grid_data[field_name] == vm.edit_pricing_variant_detail[y].variant_value_2) {
                                            if (grid_data.field_id == 0) {
                                                vm.edit_pricing_variant_detail[y].replacement_cost = grid_data[field_value_name];
                                            }
                                            if (grid_data.field_id == 1) {
                                                if (grid_data[field_value_name] == null) {
                                                    vm.edit_pricing_variant_detail[y].selling_price = vm.selling_price.amount;
                                                } else {
                                                    vm.edit_pricing_variant_detail[y].selling_price = grid_data[field_value_name];
                                                }
                                            }
                                        }
                                    }
                                }

                            }
                        }
                    });


                } else {
                    // 3 attributes
                    //
                    x_attribute_count = vm.edit_product_attributes[2].attribute_working_values.length;
                    angular.forEach(vm.item_pricing_variant_data, function (grid_data) {
                        // Y1 attribute is the first attribute/attribute listed on the general tab.
                        // Y2 attribute is the second attribute/attribute listed on the general tab.
                        // X attribute is the third attribute/attribute listed on the general tab.
                        // In this data structure, I have constructed field names for the x_att_id#
                        // that matches the number of x attribute values.  So for one given Y1/Y2 attribute value
                        // combination I have several x attribute fields ( one for each x attribute value).
                        // Also, each array entry represents a single field (order point, max_qty).  So
                        // there is an array entry per field per Y1/Y2 attribute value combination.
                        for (y = 0; vm.edit_pricing_variant_detail.length > y; y++) {
                            if (vm.edit_pricing_variant_detail[y].variant_value_1 == grid_data.y1_att_id &&
                                vm.edit_pricing_variant_detail[y].variant_value_2 == grid_data.y2_att_id) {
                                for (var z = 0; x_attribute_count > z; z++) {
                                    var field_name = 'x_att_id' + z.toString();
                                    var field_value_name = 'x_att_val_id' + z.toString();
                                    if (grid_data[field_name]) {
                                        if (grid_data[field_name] == vm.edit_pricing_variant_detail[y].variant_value_3) {
                                            if (grid_data.field_id == 0) {
                                                vm.edit_pricing_variant_detail[y].replacement_cost = grid_data[field_value_name];
                                            }

                                            if (grid_data.field_id == 1) {
                                                if (grid_data[field_value_name] == null) {
                                                    vm.edit_pricing_variant_detail[y].selling_price = vm.selling_price.amount;
                                                } else {
                                                    vm.edit_pricing_variant_detail[y].selling_price = grid_data[field_value_name];
                                                }
                                            }
                                        }
                                    }
                                }

                            }
                        }
                    });
                }
            }
        }
    }

    function set_modal_buttons() {
        // Item Add
        vm.item_add_save_and_edit_button = AnimatedButton.create_button({
            buttonDefaultText: 'Save & Edit',
            buttonSubmittingText: 'Saving',
            buttonSuccessText: 'Done'
        });
        vm.item_add_save_and_add_button = AnimatedButton.create_button({
            buttonDefaultText: 'Save & Add More',
            buttonSubmittingText: 'Saving',
            buttonSuccessText: 'Done'
        });

        // Kit Edit
        vm.product_kit_save_button = AnimatedButton.create_button({
            buttonDefaultText: 'Done'
        });

        //Add new Item to Kit/Shipper
        vm.item_add_kitshipper_save_button = AnimatedButton.create_button({
            buttonDefaultText: 'Save'
        });

        // Adjust Value
        vm.item_adjust_inventory_save_button = AnimatedButton.create_button({
            buttonDefaultText: 'Save',
            buttonSubmittingText: 'Saving',
            buttonSuccessText: 'Done'
        });

    }

    const check_selling_price_amount = function (branch) {
        if (vm.item.branch === branch) {
            return vm.selling_price.amount === null || angular.isUndefined(vm.selling_price.amount);
        } else {
            if (vm.product.price_by !== 0) { //Same for all stores
                const default_price = vm.product.product_variants[0].product_prices.filter(i => i.is_default === true)[0];
                return default_price.price === null;
            } else if (vm.product.price_by === 0) { //By Store
                const branch_data = vm.product.item_details.filter(i => i.branch === branch)[0];
                const default_price = branch_data.prices.filter(z => (z.is_default === true && z.is_active === true))[0];
                if (default_price === undefined)
                    return true;
                return default_price && default_price.price === null;
            }
        }
    };

    const check_for_price = function (branch) {
        return (vm.product.product_type != 9 && vm.product.product_type != 7 && vm.product.product_type !== 2 && angular.isDefined(branch) && vm.product.price_by != prompt_price_tye &&
            !vm.check_for_cost(branch) && check_selling_price_amount(branch));
    };

    vm.check_for_cost = function (branch) {

        if (vm.product.product_type === 10 && (vm.product.gift_card_type === 10 || vm.product.gift_card_type === 30)) {
            return false;
        } else if (vm.product.item_details) {
            for (var i = 0; i < vm.product.item_details.length; i++) {
                if (vm.product.item_details[i].branch === branch) {
                    var sup = vm.product.item_details[i].buying.suppliers;
                    var is_cost = chk_supp(sup);
                    if (is_cost) {
                        return true;
                    }
                }
            }
        } else {
            return false;
        }
    };

    vm.show_stores_panel = function (ev, button) {
        if (!vm.add_mode) {
            if (check_for_price(vm.item.branch)) {
                StdDialog.error("Default Price is required. Please provide price.");
                return;
            }

            /*
             * Materials tabs use css transform, which causes the panel contents to
             * have it's own coordinate system.  This means positioning the mdPanel relative
             * to the button in the normal way will not work.
             *
             * We have to calculate the coordinates based on the tab's position in the browser
             * window, the button's position within the tab, and the height of the button.
             *
             * Also, when the contents of the page is scrolled, we have to update the position
             * again by adjusting for the scroll position.  We do that in a scroll event handler.
             *
             * [5/11/2018] The position of store drop down list has updated during Kits&Shippers.
             * So updated the position for the drop down only in Product.
             */

            var store_button = $('.ep-maintenance-button-item-count-' + button);
            vm.md_tab_content_ref = store_button.closest('.ep-maintenance-tab-content');
            var main_content = $('#main-content');
            var button_offset = store_button.offset();
            var button_height = store_button.outerHeight(true);
            var content_offset = vm.md_tab_content_ref.offset();
            var panel_top = (((button_offset.top + button_height) - content_offset.top) + content_offset.top);
            var panel_left = (button_offset.left - content_offset.left) + content_offset.left;

            var actions_position = $mdPanel.newPanelPosition()
                .relativeTo('.ep-maintenance-button-item-count-' + button)
                .addPanelPosition($mdPanel.xPosition.ALIGN_START, $mdPanel.yPosition.BELOW);
            /*.absolute()
            .left(panel_left + 'px')
            .top(panel_top + 'px');*/
            var actions_config = {
                attachTo: angular.element(document.body),
                templateUrl: "app/product/product_maintenance/views/templates/product_store_list.html",
                panelClass: 'ep-material-panel-popover ep-product-store-list',
                position: actions_position,
                hasBackdrop: false,
                scope: $scope,
                onCloseSuccess: function (ref, reason) {
                    // When closed, remove the scroll event handler.
                    main_content.off('.panelScroll');
                    vm.store_list_panel = undefined;
                },
                openFrom: ev,
                clickOutsideToClose: true,
                escapeToClose: true,
                focusOnOpen: false,
                zIndex: 2
            };

            $mdPanel.open(actions_config).then(function (panelRef) {
                vm.store_list_panel = panelRef;

                const current_panel_ref = panelRef;
                $timeout(function () {
                    current_panel_ref.updatePosition(
                        $mdPanel.newPanelPosition()
                            .relativeTo('.ep-maintenance-button-item-count-' + button)
                            .addPanelPosition($mdPanel.xPosition.ALIGN_START, $mdPanel.yPosition.BELOW)
                    );
                });

                // Setup event handler to handle reposiitoning the panel on scroll.
                /*main_content.on('scroll.panelScroll', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var scroll_left = main_content.scrollLeft();
                    var scroll_top = main_content.scrollTop();
                    if (scroll_left !== 0 || scroll_top !== 0) {
                        panelRef.updatePosition($mdPanel.newPanelPosition()
                            .absolute()
                            .left((panel_left - scroll_left) + 'px')
                            .top((panel_top - scroll_top) + 'px'));
                    }
                });*/
            });
        }

    };

    /*
     * close the store list panel if open, and remove the css hack we added to allow the
     * mdPanel to position correctly.
     */
    function close_store_list_panel() {
        if (vm.store_list_panel) {
            vm.store_list_panel.close();
        }
    }

    vm.disable_on = function () {
        return (vm.add_mode || vm.save_toolbar_button.submitting || vm.save_toolbar_button_overflow.submitting);
    };

    vm.disable_on_adjust_inventory = function () {
        return (vm.add_mode || vm.save_toolbar_button.submitting || vm.save_toolbar_button_overflow.submitting || vm.product.price_by !== 3);
    };

    vm.actions_panel_callback = function (results) {
        vm.product_actions_panel = results;
    };

    const delete_product = function () {
        vm.action_delete_product(true);
    };

    const delete_item = function () {
        vm.action_delete_product(false);
    };

    const show_delete_item = function () {
        return (vm.item && vm.item.branch && (vm.item_branch_list_count > 1) && vm.all_inventory_access_obj.add_edit_item);
    };

    vm.hide_add_icon = function () {
        return (vm.all_inventory_access_obj.access_buying_supplier_tab && vm.all_inventory_access_obj.access_price_cost && vm.all_inventory_access_obj.add_edit_item && vm.all_inventory_access_obj.access_costs_gp_information);
    };

    function set_toolbar() {
        vm.save_toolbar_button = AnimatedButton.create_button(util.toolbar_save_button_options);
        // Need two buttons for each animated button - one for normal template and one for overflow template.
        // If you don't there will be two buttons with same name instantiated and this will cause issues when
        // trying to interact with the button.
        vm.save_toolbar_button_overflow = AnimatedButton.create_button(util.toolbar_save_button_options);

        vm.toolbar_options = {
            items: [
                {
                    template: function () {
                        return util.toolbar_generic_actions_component({
                            scope: $scope,
                            actions_panel_callback: vm.actions_panel_callback,
                            actions: [
                                {
                                    name: "Add this item to Buy List",
                                    on_click: vm.action_add_to_buy_list,
                                    disabled_on: vm.disable_on,
                                    permission: "add_edit_item",
                                    icon: "mdi mdi-cart-plus"
                                },
                                {
                                    name: "Adjust Inventory",
                                    on_click: vm.adjust_inventory,
                                    disabled_on: vm.disable_on_adjust_inventory,
                                    permission: "add_edit_item",
                                    icon: "mdi mdi-counter"
                                },
                                {
                                    name: "Print Labels",
                                    on_click: vm.print_labels,
                                    disabled_on: vm.disable_on,
                                    permission: "add_edit_item",
                                    icon: "mdi mdi-label"
                                },
                                {
                                    name: "Manage Images",
                                    on_click: vm.open_image_maintenance,
                                    disabled_on: vm.disable_on,
                                    permission: "add_edit_item",
                                    icon: "mdi mdi-file-image"
                                },
                                {
                                    name: "Delete Product",
                                    on_click: delete_product,
                                    disabled_on: vm.disable_on,
                                    permission: "access_deletes_from_actions",
                                    icon: "mdi mdi-delete"
                                },
                                {
                                    name: 'Delete from Selected ' + $rootScope.rs_toogo_user.configurations.location_display_label,
                                    on_click: delete_item,
                                    show_on: show_delete_item,
                                    disabled_on: vm.disable_on,
                                    permission: "access_deletes_from_actions",
                                    icon: "mdi mdi-delete"
                                }
                            ]
                        });
                    },
                    overflow: "auto",
                    overflowTemplate: function () {
                        return util.toolbar_generic_actions_component({
                            scope: $scope,
                            actions_panel_callback: vm.actions_panel_callback,
                            actions: [
                                {
                                    name: "Add this item to Buy List",
                                    on_click: vm.action_add_to_buy_list,
                                    disabled_on: vm.disable_on,
                                    permission: "add_edit_item",
                                    icon: "mdi mdi-cart-plus"
                                },
                                {
                                    name: "Count this item",
                                    on_click: vm.action_count_item,
                                    disabled_on: vm.disable_on,
                                    permission: "add_edit_item",
                                    icon: "mdi mdi-counter"
                                },
                                {
                                    name: "Print Labels",
                                    on_click: vm.print_labels,
                                    disabled_on: vm.disable_on,
                                    permission: "add_edit_item",
                                    icon: "mdi mdi-label"
                                },
                                {
                                    name: "Manage Images",
                                    on_click: vm.open_image_maintenance,
                                    disabled_on: vm.disable_on,
                                    permission: "add_edit_item",
                                    icon: "mdi mdi-file-image"
                                },
                                {
                                    name: "Delete Product",
                                    on_click: delete_product,
                                    disabled_on: vm.disable_on,
                                    permission: "access_deletes_from_actions",
                                    icon: "mdi mdi-delete"
                                },
                                {
                                    name: 'Delete from Selected ' + $rootScope.rs_toogo_user.configurations.location_display_label,
                                    on_click: delete_item,
                                    disabled_on: vm.disable_on,
                                    show_on: show_delete_item,
                                    permission: "access_deletes_from_actions",
                                    icon: "mdi mdi-delete"
                                }
                            ]
                        });
                    },
                    attributes: util.toolbar_actions_button_attributes
                },
                {
                    template: function () {
                        return util.toolbar_save_component({
                            controller: vm,
                            controllerName: "product_controller",
                            clickCallbackFunctionName: "save_product()",
                            animatedButtonName: "save_toolbar_button",
                            hideOn: "!all_inventory_access_obj.add_edit_item"
                        });
                    },
                    overflowTemplate: function () {
                        return util.toolbar_save_component({
                            controller: vm,
                            controllerName: "product_controller",
                            clickCallbackFunctionName: "save_product()",
                            animatedButtonName: "save_toolbar_button_overflow",
                            hideOn: "!all_inventory_access_obj.add_edit_item"
                        });
                    },
                    overflow: "auto",
                    attributes: util.toolbar_save_button_attributes
                },
                {
                    template: function () {
                        return util.toolbar_add_component({
                            controller: vm,
                            controllerName: "product_controller",
                            clickCallbackFunctionName: "item_quick_add_clicked",
                            disableOn: "save_toolbar_button.submitting",
                            hideOn: "!hide_add_icon()"
                        });
                    },
                    overflowTemplate: function () {
                        return util.toolbar_add_component({
                            controller: vm,
                            controllerName: "product_controller",
                            clickCallbackFunctionName: "item_quick_add_clicked",
                            disableOn: "save_toolbar_button_overflow.submitting",
                            hideOn: "!hide_add_icon()"
                        });
                    },
                    overflow: "auto",
                    attributes: util.toolbar_add_button_atrributes

                },
                {
                    template: function () {
                        return util.toolbar_grid_view_component({
                            controller: vm,
                            controllerName: "product_controller",
                            previousClickCallbackFunctionName: "toolbar_previous",
                            nextClickCallbackFunctionName: "toolbar_next",
                            gridviewClickCallbackFunctionName: "toolbar_grid_view",
                            showNextPrevious: false,
                            disableOn: "save_toolbar_button.submitting"
                        });
                    },
                    overflowTemplate: function () {
                        return util.toolbar_grid_view_component({
                            controller: vm,
                            controllerName: "product_controller",
                            previousClickCallbackFunctionName: "toolbar_previous",
                            nextClickCallbackFunctionName: "toolbar_next",
                            gridviewClickCallbackFunctionName: "toolbar_grid_view",
                            showNextPrevious: false,
                            disableOn: "save_toolbar_button_overflow.submitting"
                        });
                    },
                    overflow: "auto",
                    attributes: util.toolbar_gridview_attributes

                },
                {
                    template: function () {
                        return form_view_maintainer_service.toolbar_form_view_nav_component({
                            controllerName: "product_controller",
                            disableOn: "save_toolbar_button.submitting",
                            navigationFunctionName: "nav_service"
                        });
                    },
                    overflowTemplate: function () {
                        return form_view_maintainer_service.toolbar_form_view_nav_component({
                            controllerName: "product_controller",
                            disableOn: "save_toolbar_button_overflow.submitting",
                            navigationFunctionName: "nav_service"
                        });
                    },
                    overflow: "auto",
                    attributes: form_view_maintainer_service.toolbar_form_view_nav_attributes
                },
                {
                    // Search section
                    template: function () {
                        return util.autocomplete_search_component({
                            controller: vm,
                            controllerName: "product_controller",
                            noDataMessage: "No Items Found",
                            placeholder: "Search Item, Description, Tags, Serial Number, or UPC",
                            filter: "startswith",
                            dataSource: vm.product_search_data_source,
                            virtual: true,
                            valueMapperFunction: product_product_service.get_initial_value_mapper,
                            recordSelectedFunctionName: "maintenance_toolbar_search_selected",
                            searchClass: "ep-product-toolbar-search",
                            disableOn: "save_toolbar_button.submitting",
                            template: "<div><b>{[{ dataItem.sku | eptruncate:40:'...'  }]}</b><p style='margin-bottom: 0px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'>{[{ dataItem.description }]}</p></div>",
                            tagTemplate: "<div class='hidden-sm hidden-xs'><span class='ep-maintenance-toolbar-search-result-line-1'>{[{ dataItem.sku | eptruncate:50:'...'  }]}</span><p class='ep-maintenance-toolbar-search-result-line-2'>${ data.description }&nbsp;&nbsp;</p></div>" +
                                "<div class='hidden-lg hidden-md'><span class='ep-maintenance-toolbar-search-result-line-1'>{[{ dataItem.sku | eptruncate:40:'...'  }]}</span><p class='ep-maintenance-toolbar-search-result-line-2'>${ data.description }&nbsp;&nbsp;</p></div>"

                        });
                    },
                    overflow: "never"
                }

            ]
        };
    }

    vm.component_details_data = undefined;

    const _get_components = function () {
        return vm.component_details_data;
    };

    const _update_kit_summary = function (response) {
        vm.component_details_data = angular.copy(response.component_details);
        vm.kit_summary = angular.copy(response.component_details.component_totals);
        if (vm.all_inventory_access_obj.access_price_cost && vm.product.product_type === product_kit)
            vm.selling_price.amount = vm.kit_summary.current_kit_retail_price;
        if (vm.all_inventory_access_obj.access_price_cost && vm.product.product_type === product_shipper) {
            vm.selling_price.amount = vm.kit_summary.total_retail_price;
        }
        $timeout(function () {
            $scope.$broadcast("kit_components_reloaded");
        }, 500);

    };

    const _get_initial_price = function () {
        if (vm.product.price_by !== 2) {
            return vm.selling_price.amount;

        } else {
            var prices = vm.product.product_variants[0].product_prices;
            var default_price = prices.filter(x => x.is_default === true)
            if (default_price) {
                return default_price[0].price;
            }
        }

    };

    const _get_initial_cost = function () {
        return vm.item.buying.suppliers[0].replacement_cost;
    };

    const _get_components_details = function (product_id, branch_id, new_component_item, pricing_value = undefined) {
        const _branch_id = branch_id;
        const new_kit_item = new_component_item;

        const _get_component_payload = function () {
            const filter = {
                "branch_id": _branch_id,
                "limit": 250,
                "page": 1
            };
            if (new_kit_item) {
                filter["component_items"] = new_kit_item;
            } else {
                filter["component_items"] = vm.product.kit_components;
            }

            //For Kit
            if (vm.product.product_type === product_kit) {
                const pricing_options = vm.product.kit_price_option;

                if (angular.isDefined(pricing_options) && pricing_options !== null) {
                    filter["kit_pricing_option"] = vm.product.kit_price_option;

                    if (pricing_options === 3) {
                        filter["kit_pricing_adjustment"] = 0;
                    }

                    if (pricing_options === 2) {
                        filter["kit_pricing_adjustment"] = vm.product.kit_markup_from_cost_percent;
                    }

                    if (pricing_options === 1) {
                        filter["kit_pricing_adjustment"] = vm.product.kit_discount_off_retail_percent;
                    }

                    if (pricing_options === 0) {
                        filter["kit_retail_price"] = (angular.isDefined(pricing_value)) ? pricing_value : _get_initial_price();
                    }
                }
            }

            //For Shipper
            if (vm.product.product_type === product_shipper && vm.all_inventory_access_obj.access_buying_supplier_tab && vm.all_inventory_access_obj.access_costs_gp_information) {
                filter["shipper_cost"] = (angular.isDefined(pricing_value)) ? pricing_value : _get_initial_cost();
            }

            return filter;
        };

        product_kit_component_service.get_component_details(product_id, _get_component_payload).then(function (response) {
            _update_kit_summary(response);
        }, function (error) {
            util.handleErrorWithWindow(error);
            vm.component_details_data = [];
        });
    };

    /**
     * Setter method that update parent
     * @param obj
     * @private
     */
    const _set_product_properties = function (obj) {
        if (angular.isDefined(obj.kit_print_option)) {
            vm.product.kit_print_option = obj.kit_print_option;
        }

        if (angular.isDefined(obj.kit_components)) {
            vm.product.kit_components = obj.kit_components;
        }
    };

    function enable_component_tab(tab_index) {
        var current_session = session_storage_service.get_component_data_from_app_storage(app_name, 'component_tab');
        if ((vm.product.product_type === product_shipper || vm.product.product_type === product_kit) && current_session) {
            if (current_session.load_component) {
                $timeout(function () {
                    vm.tab_selected_index = tab_index;
                    session_storage_service.delete_component_data_from_app_storage(app_name, 'component_tab');
                });
            }
        }
    }

    const _get_original_price_id = function () {
        vm.price_by_location_price_map = {}; //Price
        vm.alternate_price_by_location_map = {}; //Alternate price
        if (vm.product.price_by === 0) {
            vm.product.item_details.forEach(function (item, index) {
                var alternate_price_by_location_list = [];
                if (item.id) {
                    for (var i = 0; i < item.prices.length; i++) {
                        if (item.prices[i].is_default && item.prices[i].is_active) {
                            vm.price_by_location_price_map[item.id] = item.prices[i].id;
                        }

                        //All the remaining prices are alternate prices starting from index  1.
                        if (i > 0) {
                            alternate_price_by_location_list[i] = item.prices[i].id;
                        }
                    }
                    vm.alternate_price_by_location_map[item.id] = alternate_price_by_location_list;
                }
            });
        }
    };

    function insert_supplier_data_no_buying_access() {
        for (var i = 0; i < vm.product.item_details.length; i++) {
            var item_detail = vm.product.item_details[i];
            item_detail.buying.suppliers = [];
        }
    }

    function get_product_record(product_id, working_with_array) {
        product_product_service.get_record(product_id, util.ad_find_options(true, false)).then(function (product) {
            vm.product = product;
            vm.product.desired_gp_percent = vm.product.desired_gp_percent === null ? "0.0000" : vm.product.desired_gp_percent;
            vm.check_access_to_serial_tab();
            vm.height_old_value = vm.product.height;
            vm.height_unit_old_value = vm.product.height_unit;
            vm.height_unit_description_old_value = vm.product.height_unit_description;
            vm.cube_old_value = vm.product.cube;
            vm.cubic_unit_old_value = vm.product.cubic_unit;
            vm.cubic_unit_description_old_value = vm.product.cubic_unit_description;
            vm.length_old_value = vm.product.length;
            vm.length_unit_old_value = vm.product.length_unit;
            vm.length_unit_description_old_value = vm.product.length_unit_description;
            vm.weight_old_value = vm.product.weight;
            vm.weight_unit_old_value = vm.product.weight_unit;
            vm.weight_unit_description_old_value = vm.product.weight_unit_description;
            vm.width_old_value = vm.product.width;
            vm.width_unit_old_value = vm.product.width_unit;
            vm.width_unit_description_old_value = vm.product.width_unit_description;
            //mimic supplier data when no buying tab permission
            if (!vm.all_inventory_access_obj.access_buying_supplier_tab) {
                insert_supplier_data_no_buying_access();
            }
            vm.product_copy = angular.copy(vm.product);
            //Creating a map of prices to send when saving. THis is required in case of "price by location".
            // We need to manage because we are loosing these when the price method is changed from "Same for all" to "by location".So just adding to map.
            _get_original_price_id();


            vm.add_set_price_flag = true;
            //Kits&Shipper event
            //$scope.$broadcast("product-data-loaded", {"parent_obj":vm.parent_details});
            vm.product_data_loaded = true;

            if (vm.has_serial_number_tab_access) {
                $scope.$broadcast('product_data_changed');
            }

            vm.tabs = {
                "general": true,
                "buying": (vm.product.product_type !== product_kit && vm.product.product_type !== product_fee
                    && vm.product.product_type !== product_membership_fee && vm.product.product_type !== product_donation
                    && (vm.product.gift_card_type !== gift_card_manage_funds)
                    && vm.all_inventory_access_obj.access_buying_supplier_tab),
                "stock_sell": (vm.product.gift_card_type !== gift_card_manage_funds),
                "price_cost": (vm.product.gift_card_type !== gift_card_manage_funds && vm.all_inventory_access_obj.access_price_cost),
                "history": (vm.product.gift_card_type !== gift_card_manage_funds && vm.all_inventory_access_obj.access_product_history),
                "components": (vm.product.product_type == product_kit || vm.product.product_type == product_shipper),
                "serial_numbers": (vm.has_serial_number_tab_access)
            };

            const temp_selected_index = vm.tab_selected_index;
            vm.tab_selected_index = undefined;

            $timeout(() => {
                if (!vm.tabs[tabs[temp_selected_index]])
                    vm.tab_clicked(default_tab_index, false);
                else {
                    vm.tab_clicked(temp_selected_index);
                }
            });

            vm.images = vm.image_maint.setImagesFromServer(product);
            vm.add_mode = false;
            var init_value = [];
            init_value.push(vm.product);
            $scope.ep_maintenance_toolbar_search.dataSource.data(init_value);
            vm.wxyz_model = vm.product.id;
            if (!working_with_array) {
                // CTV - no no no no no, we can't do a location.path while we are loading a record
                //$location.path('products/productitem/edit/' + vm.product.id);
            }
            vm.is_item_displayed = false;
            vm.current_price_by = vm.product.price_by;
            vm.alternate_deleted_price = [];

            vm.product.kit_components = orderBy(vm.product.kit_components, ['sku'], false);
            vm.product_stocking_uom = null;
            vm.product_stocking_uom_name = '';
            vm.product_selling_uom = null;
            vm.product_selling_uom_name = '';
            vm.product_selling_uom_multiple = null;
            vm.product_purchasing_uom = null;
            vm.product_purchasing_uom_name = '';
            vm.product_purchasing_uom_multiple = null;
            vm.product_order_quantity_multiple = null;
            vm.product_attribute_1_name = '';
            vm.product_attribute_2_name = '';
            vm.product_attribute_3_name = '';
            vm.format_specification_message();

            if (vm.product.stocking_uom) {
                vm.product_stocking_uom_old_value = vm.product.stocking_uom;
                vm.product_stocking_uom = vm.product.stocking_uom;
                vm.product_stocking_uom_name = vm.product.stocking_uom_name;
                vm.product_stocking_uom_name_old_value = vm.product.stocking_uom_name;
            }
            if (vm.product.default_selling_uom) {
                vm.product_selling_uom_old_value = vm.product.default_selling_uom;
                vm.product_selling_uom = vm.product.default_selling_uom;
                vm.product_selling_uom_name = vm.product.default_selling_uom_name;
                vm.product_selling_uom_name_old_value = vm.product.default_selling_uom_name;
                vm.product_selling_uom_multiple = vm.product.default_selling_multiple;
                vm.product_selling_uom_multiple_old_value = vm.product.default_selling_multiple;

            }
            if (vm.product.default_purchasing_uom) {
                vm.product_purchasing_uom = vm.product.default_purchasing_uom;
                vm.product_purchasing_uom_name = vm.product.default_purchasing_uom_name;
                vm.product_purchasing_uom_old_value = vm.product.default_purchasing_uom;
                vm.product_purchasing_uom_name_old_value = vm.product.default_purchasing_uom_name;
                // PO only wants to show order multiple as a single field on the screen even though
                // it has two functions.  If the Purchase UOM = Stocking UOM, it is an order multiple
                // used for purchasing ( I only order this in sets of 2).  It the UOMs are different,
                // it is the actual conversion factor for the Purchase UOM to the stocking UOM ( 1 box is
                // 10 eaches).
                if (vm.product.stocking_uom == vm.product.default_purchasing_uom) {
                    vm.product_purchasing_uom_multiple = 1;
                    vm.product_order_quantity_multiple = vm.product.default_purchasing_multiple;
                    vm.uom_order_multiple = parseInt(vm.product.default_purchasing_multiple);
                    vm.uom_order_multiple_old_value = parseInt(vm.product.default_purchasing_multiple);
                } else {
                    vm.product_purchasing_uom_multiple = vm.product.default_purchasing_multiple;
                    vm.product_order_quantity_multiple = 1;
                    vm.uom_order_multiple = parseInt(vm.product.default_purchasing_multiple);
                    vm.uom_order_multiple_old_value = parseInt(vm.product.default_purchasing_multiple);
                }

            }
            vm.edit_product_kit = vm.product.kit_components;
            vm.product_kit_grid_data_source.data(vm.edit_product_kit);


            vm.edit_product_upcs = [];
            vm.variant_main_id = 0;
            vm.variant_main_value = 0;
            var upc_record = [];
            if (vm.product.product_variants) {
                for (var x = 0; x < vm.product.product_variants.length; x++) {
                    if (vm.product.product_variants[x].alternate_codes.length > 0) {
                        for (var y = 0; y < vm.product.product_variants[x].alternate_codes.length; y++) {
                            // Get UPC codes for this product
                            upc_record = vm.product.product_variants[x].alternate_codes[y];
                            if (upc_record) {
                                vm.edit_product_upcs.push({
                                    'alternate_code': upc_record.alternate_code,
                                    'uom': upc_record.uom,
                                    'uom_name': upc_record.uom_name,
                                    'is_primary': upc_record.is_primary,
                                    'id': upc_record.id,
                                    'attribute_value_1': vm.product.product_variants[x].product_attribute_value_1,
                                    'attribute_value_2': vm.product.product_variants[x].product_attribute_value_2,
                                    'attribute_value_3': vm.product.product_variants[x].product_attribute_value_3
                                });
                            }
                        }
                    }
                    if (vm.product.product_variants[x].product_attribute_value_1 == null &&
                        vm.product.product_variants[x].product_attribute_value_2 == null &&
                        vm.product.product_variants[x].product_attribute_value_3 == null) {
                        vm.variant_main_id = x;
                        vm.variant_main_value = vm.product.product_variants[x].id;
                    }
                }
            }
            vm.edit_product_attributes = JSON.parse(JSON.stringify(vm.product.product_attributes));

            angular.forEach(vm.edit_product_attributes, function (variant, key) {
                // Copy the currently selected attributes to a working copy variable so I can tell when they change.
                variant.attribute_working_values = variant.attribute_values;

            });

            if (vm.edit_product_attributes && vm.edit_product_attributes.length > 1) {
                vm.set_attribute_value_data_sources();
            }

            if (!working_with_array) {
                vm.toolbar_breadcrumbs = util.bread_crumb_string_generator([
                    {name: "Products"},
                    {name: "Product Overview", href: "products/grid"},
                    {name: "Edit Product - <strong>{[{product_controller.product.sku | eptruncate:20:'...' }]}</strong>"}
                ], $scope);
            }
            vm.current_item_branch = $rootScope.rs_toogo_user.configurations.location_display_label + " Information:  Item not in Store Record.";
            vm.branch_text_not_found = true;
            count_product_upcs();
            enable_component_tab(component_tab_index[product.product_type]);

            clear_item_fields();
            vm.set_product_prices();
            vm.get_carousel_images();
            vm.setup_firearm_fields();
            vm.get_branch_records(true);

            $timeout(() => {
                set_category_tree_view(vm.product.category);
            });


            $timeout(function () {
                unsaved_data_tracker.add_element('products_detail',
                    "product_controller.get_edited_properties_for_unsaved_data()", $scope);

                unsaved_data_tracker.add_element('products_tag_detail',
                    "product_controller.product.product_tags", $scope, contacts_service.compare_tags);

            });

            $scope.$broadcast('product_notes_record_changed', vm.product);
            unsaved_data_tracker.add_element("images", "product_controller.image_maint.toServerImageArray()", $scope);
        }, function (reason) {
            util.handleErrorWithWindow(reason);
        });
    }

    vm.format_specification_message = function () {
        var added_width = false;
        var added_length = false;
        vm.product_specification = "";
        if (vm.product.length && angular.isDefined(vm.product.length)) {
            vm.product_specification = "Size: ";
            vm.product_specification = vm.product_specification + vm.product.length +
                ' ' + vm.product.length_unit_description;
            added_length = true;
        }
        if (vm.product.width && angular.isDefined(vm.product.width)) {
            if (added_length) {
                vm.product_specification = vm.product_specification + ' x ';
            } else {
                vm.product_specification = "Size: ";
            }
            vm.product_specification = vm.product_specification + vm.product.width +
                ' ' + vm.product.width_unit_description;
            added_width = true;
        }
        if (vm.product.height && angular.isDefined(vm.product.height)) {
            if (added_width || added_length) {
                vm.product_specification = vm.product_specification + ' x ';
            } else {
                vm.product_specification = "Size: ";
            }
            vm.product_specification = vm.product_specification + vm.product.height +
                ' ' + vm.product.height_unit_description;
        }
        if (vm.product.weight && angular.isDefined(vm.product.weight)) {
            vm.product_specification = vm.product_specification + ' Weight: ' +
                vm.product.weight + ' ' + vm.product.weight_unit_description;
        }
        if (vm.product.cube && angular.isDefined(vm.product.cube)) {
            vm.product_specification = vm.product_specification + ' Cube: ' +
                vm.product.cube + ' ' + vm.product.cubic_unit_description;
        }


    };

    function clear_item_fields() {
        vm.item = {};
        vm.item.buying = {};
        vm.item.selling = {};
        vm.item.stocking = {};
        vm.item.buying.popularity = null;
        vm.item.buying.supplier = null;
        vm.item.buying.purchasing_uom = {};
        vm.item.buying.order_point = null;
        vm.item.selling.tax_code_id = null;
        vm.item.selling.label_count_type = null;
        vm.item.selling.is_loyalty_active = true;
        vm.item.stocking.is_stocked = true;
        vm.item.stocking.track_inventory = true;
        vm.item.selling.is_discountable = true;
        vm.item.selling.is_taxable = true;
        vm.item_branch = null;
        vm.item_branch_list = [];
        vm.item_purchase_uom = {};
        vm.item_stock_uom = {};
        vm.item_sell_uom = {};
        vm.item_add_to_stores = [];
        vm.selected_supplier = {};
    }

    function count_product_upcs() {
        vm.product_upc_count = 0;
        if (vm.product.product_variants) {
            angular.forEach(vm.product.product_variants, function (product_variant) {
                if (product_variant.alternate_codes && product_variant.alternate_codes.length > 0) {
                    vm.product_upc_count += product_variant.alternate_codes.length;
                }
            });
        }
    }

    vm.toolbar_grid_view = function () {
        inventory_grid_service.save_state_data('product_edit', 'previous_page');
        $timeout(function () {
            $location.path("products/grid");
        });
    };

    vm.action_delete_product = function (product_only) {
        if (vm.product_actions_panel) {
            vm.product_actions_panel.close();
        }

        if (product_only) {
            if ((vm.product.product_type !== 2 || vm.product.product_type !== 7) && (vm.product.kit_member || vm.product.shipper_member.shipper_member)) {
                vm.component_dialog_clicked(product_only);
                return false;
            }
            vm.product_to_delete_id = vm.product.id;
            StdDialog.informational_alert({
                text: 'Are you sure you wish to delete this product?',
                title: 'Delete Product',
                callback: vm.delete_product_answered,
                scope: $scope,
                continue_text: "Yes",
                cancel_text: "No",
                default_focus_on: 'no'
            });
        } else {
            if (vm.item_branch_list_count > 1) {
                vm.branch_to_delete_id = vm.item.branch;
                StdDialog.informational_alert({
                    text: 'Are you sure you wish to delete this item?',
                    title: 'Delete Item',
                    callback: vm.delete_item_answered,
                    scope: $scope,
                    continue_text: "Yes",
                    cancel_text: "No",
                    default_focus_on: 'no'
                });
            } else {
                StdDialog.information('A Product must always have at least one Item record.');
            }
        }
    };

    vm.delete_product_answered = function (delete_product) {
        if (delete_product) {
            vm.remove_product(vm.product_to_delete_id);
        }
    };

    vm.delete_item_answered = function (delete_item) {
        if (delete_item) {
            vm.remove_item(vm.branch_to_delete_id);
        }
    };

    vm.remove_product = function (product_id) {
        vm.save_toolbar_button.start();
        const items = vm.product.item_details.map(a => a.id);
        product_product_service.delete_record({id: product_id}).then(function (data) {

            vm.save_toolbar_button.success();
            vm.product = {};
            vm.images = vm.image_maint.setImages([]);
            vm.edit_product_attributes = [];
            clear_item_fields();
            vm.selected_category = vm.selected_category_default;
            vm.selected_cateogry_id = null;
            //remove_item_from_session_storage(items);
            //vm.set_uom_for_default_uom_data_source();
            vm.set_product_prices();
            vm.get_branch_records(false);
            vm.is_item_displayed = false;
            vm.current_item_branch = $rootScope.rs_toogo_user.configurations.location_display_label +
                " Information:  Item not in Store Record.";
            vm.branch_text_not_found = true;
            $timeout(function () {
                vm.nav_service.delete_current_index_from_navigation(app_name, component_name,
                    "/products/productitem/new/", "product_ids");
            });

            unsaved_data_tracker.clear();

        }, function (reason) {
            vm.save_toolbar_button.failure();
            util.handleErrorWithWindow(reason);
        });
    };


    vm.remove_item = function (branch) {
        var deleting_item_branch;
        for (var x = 0; x < vm.product.item_details.length; x++) {
            if (vm.product.item_details[x].branch == branch) {
                deleting_item_branch = vm.product.item_details[x].branch;
                vm.product.item_details[x].is_deleted = true;
                vm.is_item_displayed = false;
                /*if(vm.product.product_type === product_kit) {
                    $scope.$broadcast("delete_item", vm.product.item_details[x].branch);
                }*/
            }
        }

        vm.current_item_branch = $rootScope.rs_toogo_user.configurations.location_display_label + " Information:  Item not in Store Record";
        vm.component_current_item_branch = "Cost, Retails & Quantity on Hand Shown for :  Item not in Store Record";
        vm.branch_text_not_found = true;
        var deleted_branch_list = vm.product.item_details.filter(function (item) {
            return item.is_deleted === true;
        });

        vm.item_branch_list_count = (vm.product.item_details.length - deleted_branch_list.length);
        vm.disable_tabs_section = true;
        vm.product_suppliers = [];
        $scope.$broadcast('set_suppliers');
        vm.item = {};
        $scope.$broadcast("default_store_deleted", true);

        //Commenting this code as we are doing a client delete (deleting from the vm.product.item_details). And we have a single global save now.
        // vm.save_toolbar_button.start();
        // product_product_service.update_record(vm.product, util.ad_patch_options(false)).then(function (product) {
        //     vm.save_toolbar_button.success();
        //     vm.product = product;
        //     set_category_tree_view(vm.product.category);
        //     vm.is_item_displayed = false;
        //     clear_item_fields();
        //     //vm.set_uom_for_default_uom_data_source();
        //     remove_item_from_session_storage(item_id);
        //     vm.set_product_prices();
        //     vm.get_branch_records(false);
        //     vm.current_item_branch = $rootScope.rs_toogo_user.configurations.location_display_label +
        //         " Information:  No Item Found.";
        //
        // }, function error(reason) {
        //     vm.save_toolbar_button.failure();
        //     $timeout(function () {
        //         util.handleErrorWithWindow(reason);
        //     }, 2500);
        // });

    };

    function set_category_tree_view(category_id) {
        vm.selected_category = vm.selected_category_default;
        vm.selected_category_id = null;
        if (category_id != null) {
            var treeview = $("#category_tree_view").data("kendoTreeView");
            var varDataItem = treeview ? treeview.dataSource.get(category_id) : undefined;
            if (varDataItem) {
                vm.selected_category = varDataItem.name;
                vm.selected_category_id = category_id;
            } else {
                if (category_id == vm.product.category) {
                    vm.selected_category = vm.product.category_name;
                    vm.selected_category_id = vm.product.category;
                }
            }
        }
    }

    vm.dgp_changed = function (e) {
        if (angular.isDefined(e.target) && $(e.target).val() === "") {
            vm.product.desired_gp_percent = "0.0000";
        }
    };

    function get_product_data() {
        vm.desired_gp_options = {
            format: "n2",
            decimals: 2,
            min: 0,
            max: 999.99,
            spinners: false,
            round: false,
            restrictDecimals: true,
            change: function () {
                if (this.value() === null) {
                    vm.product.desired_gp_percent = "0.0000";
                }
                if (!$scope.$root.$$phase)
                    $scope.$apply();
            }
        };

        vm.lbm_measurement_options = { //obsolete : not being used
            format: "n4",
            decimals: 4,
            min: 0,
            max: 99999999.9999,
            spinners: false,
            round: false,
            restrictDecimals: true
        };

        vm.product_kit_quantity_options = { //obsolete : not being used
            format: "n4",
            decimals: 4,
            min: 0,
            max: 999.9999,
            spinners: false,
            round: false,
            restrictDecimals: true
        };

        vm.product_selling_uom_multiple_options = {
            format: '#',
            decimals: 0,
            min: 0,
            max: 99999,
            spinners: false,
            restrictDecimals: true
        };

        vm.product_default_order_multiple_options = {
            format: '#',
            decimals: 0,
            min: 1,
            max: 99999,
            spinners: false,
            round: false,
            restrictDecimals: true
        };
        vm.product_order_multiple_options = {
            format: '#',
            decimals: 0,
            min: 1,
            max: 99999,
            spinners: false,
            round: false,
            restrictDecimals: true
        };


        vm.category_filter = {list_type: 'hierarchical_list'};

        vm.category_hierarchical_datasource = product_category_hierarchical_service.get_record_complete_hierarchical_data_source(util.ad_find_options(true, false),
            vm.category_filter, 99999, $scope);


        vm.category_highlighted = false;
        vm.category_tree_view_options = {
            //dataTextField: "name",
            //checkboxes: false,
            //loadOnDemand: true,
            //expandAll: false,
            //template: "<div>{[{ dataItem.code | eptruncate:10:'...'}]} - {[{ dataItem.name | eptruncate:40:'...'  }]}</div>",
            //dataBound: function (e) {
            //    //e.sender.expand(e.node);
            //}
            // dataBound: function() {
            //     vm.focus_category_tree_search = true;
            //     highlight_category(vm.category_highlighted);
            // },
            loadOnDemand: true
        };

        vm.new_item_category_filter = {list_type: 'hierarchical_list'};

        vm.new_item_category_hierarchical_datasource = product_category_hierarchical_service.get_record_complete_hierarchical_data_source(util.ad_find_options(true, false),
            vm.new_item_category_filter, 99999, $scope);

        vm.new_item_category_highlighted = false;

        vm.new_item_category_tree_view_options = {
            //dataTextField: "name",
            //checkboxes: false,
            //loadOnDemand: true,
            //expandAll: false,
            //template: "<div>{[{ dataItem.code | eptruncate:10:'...'}]} - {[{ dataItem.name | eptruncate:35:'...'  }]}</div>",
            //dataBound: function (e) {
            //    //e.sender.expand(e.node);
            //}
            // dataBound: function() {
            //     vm.focus_category_tree_search = true;
            //     highlight_new_item_category(vm.new_item_category_highlighted);
            // },
            loadOnDemand: true
        };

        vm.selected_category = "Select Category";
        vm.new_item_selected_category = "Select Category";

        vm.category_selected = function (dataItem) {
            //vm.selected_category = dataItem.text;
            if (dataItem) {
                vm.selected_object = dataItem;
                vm.selected_category = vm.selected_object.name;
                vm.selected_category_id = vm.selected_object.id;
                if (!vm.doing_highlight) {
                    vm.category.isopen = false;
                }

            }
            //vm.selected_category = dataItem.name;
            //vm.selected_category_id = dataItem.id;

            //$scope.category_panel_bar.collapse("#category_panelbar_item");
        };

        vm.category_toggled = function (open) {

            vm.clear_category_filter();

            if (open) {

                vm.focus_category_search = true;

                $timeout(function () {
                    vm.doing_highlight = false;
                    highlight_category(false);
                });

            } else {
                if (vm.selected_category != vm.selected_category_default) {
                    vm.product.category = vm.selected_category_id;
                    vm.product.category_name = vm.selected_category;
                }
            }
        };

        vm.clear_category_filter = function () {

            if (vm.category_search != "" || vm.category_search_results_shown) {

                vm.category_search = "";
                vm.category_filter = {list_type: 'hierarchical_list'};

                var category_treeview = $("#category_tree_view").data("kendoTreeView");
                category_treeview.setDataSource(product_category_hierarchical_service.get_record_complete_hierarchical_data_source(util.ad_find_options(true, false),
                    vm.category_filter, 99999, $scope));

                vm.category_search_results_shown = false;
            }
        };


        vm.search_category = function () {

            if (vm.category_search.length === 0) {
                vm.clear_category_filter();
                return;
            } else if (vm.category_search.length < 2) {
                return;
            }

            vm.processing_category_search = true;

            if (vm.category_search && vm.category_search.length > 0) {
                vm.category_filter.search = vm.category_search;
            } else {
                vm.category_filter = {list_type: 'hierarchical_list'};
            }

            var category_treeview = $("#category_tree_view").data("kendoTreeView");
            category_treeview.setDataSource(product_category_hierarchical_service.get_record_server_filter_hierarchical_data_source(util.ad_find_options(true, false),
                vm.category_filter, 99999, $scope));

        };

        /*vm.search_category = function(keyEvent){
         if (vm.category_search && vm.category_search.length > 1) {
         vm.filter_category(true);
         } else {
         vm.filter_category(false);
         }
         };
         */
        vm.highlight_tree_search_results = function (tree_id, filterText) {

            function is_scrolled_into_view(container, elem) {
                var elem_top = elem.offset().top;
                if (elem_top < 0) {
                    return false;
                }
                if (elem_top < container.height()) {
                    return true;
                }
                return false;
            }

            var tree = angular.element("#" + tree_id);
            var tlen = filterText.length;
            var first_match = true;

            // var treeView = tree.data("kendoTreeView");
            // var expanded_state = tree.hasClass('expanded');
            // if (filterText.length <= 0  && expanded_state) {
            //     $('#'+tree_id+' .k-in .highlight').removeClass('highlight');
            //     tree.removeClass('expanded');
            //     treeView.collapse(".k-item");
            //     if (tree_id == "category_tree_view"){
            //         highlight_category(false);
            //     } else {
            //         highlight_new_item_category(false);
            //     }
            //
            //     return;
            // }
            //treeView.expand(".k-item");
            //tree.addClass('expanded');
            // tree.find(" .k-group .k-group .k-in").closest("li").hide();
            // tree.find(" .k-group > li").hide();

            $('#' + tree_id + ' .k-in .highlight').removeClass('highlight');

            filterText = filterText.toLowerCase();

            tree.find(" .k-in").each(function () {
                var tree_dom = angular.element(this);
                var text = tree_dom.text().trim().toLowerCase();

                var normal_text = tree_dom.text().trim();

                if (text.toLowerCase().indexOf(filterText) > -1) {
                    tree_dom.html(tree_dom.text());
                    var html = '';
                    var q = 0;
                    var p = 0;
                    if (filterText.length > 0 && text.indexOf(filterText) > -1) {
                        while ((p = text.indexOf(filterText, q)) > -1) {
                            html += normal_text.substring(q, p) + '<span class="highlight">' + normal_text.substr(p, tlen) + '</span>';
                            q = p + tlen;
                        }
                    }
                    if (q > 0) {
                        html += normal_text.substring(q);
                        tree_dom.html(html);
                    } else {
                        tree_dom.html(tree_dom.text());
                    }

                    if (first_match && !(is_scrolled_into_view(tree, tree_dom))) {
                        var _offset = tree_dom.offset().top - (tree.offset().top + tree.scrollTop() + 30);
                        $("#" + tree_id).animate({scrollTop: _offset});
                        first_match = false;
                    }

                    //expand_parents(tree_dom);
                }
                // function expand_parents(tree_dom){
                //     tree_dom.closest('li').show();
                //     tree_dom.parents("ul, li").each(function() {
                //         treeView.expand(tree_dom.parents("li"));
                //         tree_dom.show();
                //         if(angular.element(this).parents("ul, li").length > 0){
                //             expand_parents(angular.element(this));
                //         }
                //     });
                // }
            });
            // tree.find(" .k-group .k-in:contains(" + filterText + ")").each(function() {
            //     angular.element(this).parents("ul, li").each(function() {
            //         angular.element(this).show();
            //     });
            // });
        };

        vm.new_item_category_selected = function (dataItem) {
            if (dataItem) {
                vm.selected_object = dataItem;
                vm.new_item_selected_category = vm.selected_object.name;
                vm.new_item_selected_category_id = vm.selected_object.id;
                if (!vm.doing_highlight) {
                    vm.new_item_category.isopen = false;
                }
                if (vm.new_item.product_type == product_firearm || vm.new_item.product_type == product_standard || vm.new_item.product_type == product_fee) {
                    product_category_hierarchical_service.get_record(vm.new_item_selected_category_id,
                        util.ad_find_options(true, false)).then(function (data) {
                        if (vm.new_item.desired_gp_percent === "0.0000" || vm.new_item.desired_gp_percent === null || angular.isUndefined(vm.new_item.desired_gp_percent)) {
                            vm.new_item.desired_gp_percent = data.desired_gp_percent;
                        }
                    }, function (reason) {
                        util.handleErrorWithWindow(reason);
                    });


                } else {
                    vm.new_item.desired_gp_percent = null;
                }
            }
        };

        vm.clear_new_item_category_filter = function () {

            if (vm.new_item_category_search != "" || vm.new_item_category_search_results_shown) {

                vm.new_item_category_search = "";
                vm.new_item_category_filter = {list_type: 'hierarchical_list'};

                var new_item_treeview = $("#new_item_category_tree_view").data("kendoTreeView");
                new_item_treeview.setDataSource(product_category_hierarchical_service.get_record_complete_hierarchical_data_source(util.ad_find_options(true, false),
                    vm.new_item_category_filter, 99999, $scope));

                vm.new_item_category_search_results_shown = false;
            }
        };

        vm.new_item_category_toggled = function (open) {

            vm.clear_new_item_category_filter();

            if (open) {

                vm.focus_new_item_category_search = true;

                $timeout(function () {
                    vm.doing_highlight = false;
                    highlight_new_item_category(false);
                });
            }
        };

        vm.new_item_search_category = function () {

            if (vm.new_item_category_search.length < 1) {
                vm.clear_new_item_category_filter();
                return;
            } else if (vm.new_item_category_search.length < 2) {
                return;
            }

            vm.processing_new_item_category_search = true;

            if (vm.new_item_category_search && vm.new_item_category_search.length > 0) {
                vm.new_item_category_filter.search = vm.new_item_category_search;
            } else {
                vm.new_item_category_filter = {list_type: 'hierarchical_list'};
            }

            var new_item_treeview = $("#new_item_category_tree_view").data("kendoTreeView");
            new_item_treeview.setDataSource(product_category_hierarchical_service.get_record_server_filter_hierarchical_data_source(util.ad_find_options(true, false),
                vm.new_item_category_filter, 99999, $scope));

        };

        // vm.new_item_search_category = function(){
        //    if (vm.new_item_category_search && vm.new_item_category_search.length > 0) {
        //        vm.filter_new_item_category(true);
        //    } else {
        //        vm.filter_new_item_category(false);
        //    }
        // };

        vm.product_price_group_data_source = pricing_product_price_group_service.get_record_data_source(util.ad_find_options(true, false),
            pricing_product_price_group_service.filter_none(), 99999, $scope);
        vm.product_price_group_dropdown_options = {
            optionLabel: " "
        };

        vm.product_attribute_data_source = product_matrix_dimension_service.get_record_data_source(util.ad_find_options(true, false),
            product_matrix_dimension_service.filter_attributes(), 999999, $scope);
        vm.product_attribute_dropdown_options = {
            dataSource: vm.product_attribute_data_source
        };

        vm.product_uom_data_source = product_uom_service.get_record_server_filter_data_source(util.ad_find_options(true, false),
            product_uom_service.filter_none(), util.datasource_pagesize, $scope);

        vm.product_uom_dropdown_options = function () {
            return {
                dataSource: product_uom_service.get_record_server_filter_data_source(util.ad_find_options(true, false), product_uom_service.filter_none(), util.datasource_pagesize, $scope),
                virtual: {
                    itemHeight: 30,
                    valueMapper: function (options) {
                        if (options.value) {
                            let mapper_data = {
                                key_name: "id",
                                keys: [parseInt(options.value)]
                            };
                            product_uom_value_mapper_index_service.product_uom_value_mapper(mapper_data).then(function (result) {
                                if (result.indexes[0] == null) {
                                    result.indexes = [];
                                }
                                options.success(result.indexes);
                            }, function (error) {
                                util.handleErrorWithWindow(error);
                            });
                        }
                    }
                }
            }
        };

        vm.firearm_types_data_source = new kendo.data.DataSource();
        vm.attribute_value_1_data_source = new kendo.data.DataSource();
        vm.attribute_value_2_data_source = new kendo.data.DataSource();
        vm.attribute_value_3_data_source = new kendo.data.DataSource();

        product_choices_service.get_records(util.ad_find_options(true, false), product_choices_service.filter_none(), 999999, $scope).then(function (product_choices) {
            vm.product_choices = product_choices;
            vm.defective_policy_ds = product_choices.defective_policy;
            vm.product_type_data_source = new kendo.data.DataSource({
                data: product_choices.product_type
            });
            vm.gift_card_type_data_source = new kendo.data.DataSource({
                data: product_choices.gift_card_type_with_manage_funds
            });
            vm.keep_running_cost_options = {
                dataSource: product_choices.keep_running_value,
                template: "${ data.name }"
            };

            vm.serialized_data_source = new kendo.data.DataSource({
                data: product_choices.product_serialization
            });

            vm.product_price_by_gift_cards_data_source = product_choices.product_price_by_gift_cards;
            vm.product_price_by_data_source = product_choices.product_price_by;
            vm.product_price_by_gift_cards_data_source = product_choices.product_price_by_gift_cards;
            vm.lbm_measurement_data_source = new kendo.data.DataSource({
                data: product_choices.lbm_measurement_type
            });
            vm.item_label_count_type_data_source = product_choices.label_count_type.filter((label) => label.id !== 4);
            vm.product_uom_cube_unit_data_source = product_choices.cube_unit;
            vm.product_uom_length_unit_data_source = product_choices.length_unit;
            vm.product_uom_weight_unit_data_source = product_choices.weight_unit;
            vm.kit_price_data_source = new kendo.data.DataSource({
                data: product_choices.kit_price_option
            });

            vm.firearm_types_data_source.data(product_choices.firearm_type);
            if (product_choices.system_default_stocking_uom && product_choices.system_default_stocking_uom.length == 1) {
                vm.system_default_stocking_uom = product_choices.system_default_stocking_uom[0].id;
                vm.system_default_stocking_uom_name = product_choices.system_default_stocking_uom[0].code;
            }

            //Kit print option choices
            vm.kit_print_data_option = product_choices.kit_print_option;
            vm.add_item_to_kit_type = product_choices.product_type;

        });
        vm.product_type_dropdown_options = {};
        vm.kit_price_dropdown_options = {};
        vm.serialization_dropdown_options = {};

        vm.lbm_measurement_dropdown_options = {};
        vm.firearm_manufacturers_data_source = new kendo.data.DataSource({
            data: vm.firearm_manufacturers_data
        });
        vm.firearm_models_data_source = new kendo.data.DataSource({
            data: vm.firearm_models_data
        });
        vm.firearm_caliber_or_gauges_data_source = new kendo.data.DataSource({
            data: vm.firearm_caliber_or_gauges_data
        });
        vm.product_uom_length_unit_dropdown_options = {
            optionLabel: " ",
            select: function (e) {
                vm.product_specification_uom_length_selected(e);
            }
        };
        vm.product_uom_height_unit_dropdown_options = {
            optionLabel: " ",
            select: function (e) {
                vm.product_specification_height_selected(e);
            }
        };
        vm.product_uom_width_unit_dropdown_options = {
            optionLabel: " ",
            select: function (e) {
                vm.product_specification_width_selected(e);
            }
        };
        vm.product_uom_cube_unit_dropdown_options = {
            optionLabel: " ",
            select: function (e) {
                vm.product_specification_cube_selected(e);
            }
        };
        vm.product_uom_weight_unit_dropdown_options = {
            optionLabel: " ",
            select: function (e) {
                vm.product_specification_weight_selected(e);
            }
        };

        //  vm.product_uom_dropdown_options = {};

        vm.product_default_uoms_dropdown_options = {
            optionLabel: " "
        };
        vm.item_qty_options = {
            format: "#",
            decimals: 0,
            min: 1,
            max: 999999,
            restrictDecimals: true
        };
        vm.product_uom_number_options = {
            format: "n2",
            decimals: 2,
            min: 0,
            max: 99999.99,
            spinners: false,
            round: false,
            restrictDecimals: true
        };

        vm.product_kit_data_source = product_product_service.get_record_server_filter_data_source(util.ad_find_options(true, false),
            product_product_service.filter_products(vm.product_kit_search), 20, $scope);
        vm.product_kit_dropdown_options = {};

        /* Firearms */

        vm.firearm_type_dropdown_options = {
            dataSource: vm.firearm_types_data_source,
            dataTextField: 'name',
            dataValueField: 'id',
            valuePrimitive: true,
            height: 300,
            index: 0
        };

        vm.firearm_manufacturer_dropdown_options = {
            optionLabel: ' ',
            dataSource: vm.firearm_manufacturers_data_source,
            template: "${data.brand_name}",
            dataTextField: 'brand_name',
            //dataValueField: 'brand_id',
            dataValueField: 'brand_name',
            valuePrimitive: true,
            height: 300
        };

        vm.firearm_model_dropdown_options = {
            optionLabel: ' ',
            dataSource: vm.firearm_models_data_source,
            template: "${data.model_name}",
            dataTextField: 'model_name',
            //dataValueField: 'model_id',
            dataValueField: 'model_name',
            valuePrimitive: true,
            height: 300
        };

        vm.firearm_caliber_or_gauge_dropdown_options = {
            optionLabel: ' ',
            dataSource: vm.firearm_caliber_or_gauges_data_source,
            template: "${data.caliber_or_gauge}",
            dataTextField: 'caliber_or_gauge',
            dataValueField: 'caliber_or_gauge',
            valuePrimitive: true,
            height: 300
        };
    }

    function get_item_data() {

        vm.is_item_displayed = false;

        vm.last_counted_date_options = {
            max: new Date(),
            parseFormats: util.date_parse_formats
        };

        vm.last_received_date_options = {
            max: new Date(),
            parseFormats: util.date_parse_formats
        };

        vm.last_sole_date_options = {
            max: new Date(),
            parseFormats: util.date_parse_formats
        };

        vm.record_added_date_options = {
            max: new Date(),
            parseFormats: util.date_parse_formats
        };

        vm.item_total_quantity_options = { // obsolete not being used
            format: "n4",
            decimals: 4,
            min: -9999999.9999,
            max: 99999999.9999,
            spinners: false,
            round: false,
            restrictDecimals: true
        };

        vm.item_label_count_options = {
            format: "#",
            decimals: 0,
            min: 0,
            max: 999999,
            spinners: false,
            restrictDecimals: true
        };

        vm.item_uom_number_options = {
            format: "n4",
            decimals: 4,
            min: 0,
            max: 99999.9999,
            spinners: false,
            round: false,
            restrictDecimals: true
        };


        vm.upc_uom_drop_down_options = {};

        vm.item_tax_code_data_source = organization_tax_code_service.get_record_data_source(util.ad_find_options(true, false),
            organization_tax_code_service.filter_none(), util.datasource_pagesize, $scope);
        vm.item_tax_code_dropdown_options = {
            optionLabel: " ",
            virtual:{
                itemHeight:30,
                valueMapper: function (options) {
                    if (options.value) {
                        let mapper_data = {
                            key_name: "id",
                            keys: [parseInt(options.value)]
                        };
                        tax_code_value_mapper_index_service.tax_code_value_mapper_init_value(mapper_data).then(function (result) {
                            if (result.indexes[0] == null) {
                                result.indexes = [];
                            }
                            options.success(result.indexes);
                        }, function (error) {
                            util.handleErrorWithWindow(error);
                        });
                    }
                }
            }
        };

        vm.item_season_data_source = product_season_service.get_record_data_source(util.ad_find_options(true, false),
            product_season_service.filter_none(), 999999, $scope);
        vm.item_season_dropdown_options = {
            optionLabel: " "
        };

        vm.item_label_count_type_dropdown_options = {};

        vm.item_branch_data_source = organization_branch_service.get_record_server_data_source_no_limit(util.ad_find_options(true, false),
            organization_branch_service.filter_none(), 999999, $scope);
        vm.new_item_branch_data_source = organization_branch_service.get_record_data_source(util.ad_find_options(true, false),
            organization_branch_service.filter_none(), 999999, $scope);

        vm.item_branch_dropdown_options = {
            template: '<span><b> #: branch_number #</b> #: name #</span>'
        };

        vm.purchase_uom_data_source = new kendo.data.DataSource({
            data: vm.existing_purchase_uoms,
            type: "json"
        });
        vm.sell_uom_data_source = new kendo.data.DataSource({
            data: vm.existing_sell_uoms,
            type: "json"
        });
        vm.stock_uom_data_source = new kendo.data.DataSource({
            data: vm.existing_stock_uoms,
            type: "json"
        });
        vm.sell_price_uom_data_source = new kendo.data.DataSource({
            data: vm.existing_sell_price_uoms,
            type: "json"
        });

        vm.upc_uom_data_source = new kendo.data.DataSource({
            data: vm.existing_upc_uoms,
            type: "json"
        });

        vm.selling_uom_dropdown_options = {
            autobind: false
        };

        vm.add_to_stores_select_options = {
            dataTextField: "name",
            dataValueField: "id",
            valuePrimitive: true,
            itemTemplate: '<h5 style="margin: 0px;"><strong>#: data.branch_number #</strong></h5><h5 style="margin-left: 5px; margin-top: 2px; margin-bottom: 4px;">#: data.name # </h5>',
            dataSource: vm.item_branch_data_source,
            label_name: "Add to Selected " + $rootScope.rs_toogo_user.configurations.location_display_plural,
            minLength: 1,
            autoBind: true
        };
        vm.new_item_add_to_stores_select_options = {

            dataTextField: "name",
            dataValueField: "id",
            valuePrimitive: true,
            minLength: 1,
            itemTemplate: '<h5 style="margin: 0px;"><strong>#: data.branch_number #</strong></h5><h5 style="margin-left: 5px; margin-top: 2px; margin-bottom: 4px;">#: data.name # </h5>',
            autoBind: true,
            dataSource: vm.new_item_branch_data_source,
            label_name: "Select " + $rootScope.rs_toogo_user.configurations.location_display_label + "(s)",
            select: function (e) {
                var stores_component = $("#new_add_to_stores_elem").data('kendoMultiSelect');
                var stores_selected = stores_component.value().slice();

                var stores_changed = false;
                if (e.dataItem.id == -1) {
                    stores_selected.splice(0, stores_selected.length);
                    stores_changed = true;
                } else {
                    var index = $.inArray('-1', stores_selected);

                    if (index > -1) {
                        stores_selected.splice(index, 1);
                        stores_changed = true;
                    }
                }

                if (stores_changed) {
                    // Clean filtering
                    stores_component.dataSource.filter({});
                    // Set new values
                    stores_component.value(stores_selected);
                    stores_component.trigger("change");
                }
            },
            dataBound: function (e) {
                if (e.sender && !e.sender.dataItem() && vm.new_item.stores.length === 0 && !vm.init_store_load) {
                    if (e.sender.dataSource.data().length > 1) {
                        vm.new_item.stores = [-1];
                    } else if (e.sender.dataSource.data().length === 1) {
                        vm.new_item.stores = [vm.current_active_branch];
                    } else {
                        vm.new_item.stores = [];
                    }
                }

                if (!vm.init_store_load) {
                    vm.init_store_load = true;
                }
            }
        };

        vm.new_item_branch_data_source.bind('change', function (e) {
            if (e.items.length > 1) {
                e.items.unshift({
                    name: 'All ' + $rootScope.rs_toogo_user.configurations.location_display_plural,
                    id: '-1',
                    branch_number: ''
                });
            }
        });

        vm.item_history_grid_options = {
            toolbar: [
                {
                    template: `<kendo-button class="toolbar_icon-state grid_toolbar_icons"
                                             title="Export to Excel"
                                             ng-click="product_controller.history_export_to_excel()"
                                             ng-disabled="product_controller.history_excel_button_disabled()" >
                                   <span class="${getFontIcon('mdi-file-excel')}"></span>
                               </kendo-button>`

                }
            ],
            sortable: {
                mode: "single",
                serverSorting: true,
                allowUnsort: false
            },
            pageable: util.ep_grid_pageable_options,
            selectable: "row",
            scrollable: util.ep_grid_scrollable,
            columnMenu: util.ep_grid_column_menu,
            change: function (e) {
                var selected_row = this.select();
                vm.selected_item_history_detail = this.dataItem(selected_row[0]);
            },
            dataBound: function (e) {
                var grid = this;
                var gridElement = $("#item_history_grid");

                if (gridElement) {
                    var dataArea = gridElement.find(".k-grid-content");
                }

                $timeout(function () {
                    if (grid.dataSource.total() == 0) {
                        if (gridElement && dataArea) {
                            dataArea.height(0);
                        }
                    } else {
                        if (gridElement && dataArea) {
                            dataArea.height(util.maintenance_grid_height);
                            grid.resize(true);
                        }
                    }
                });

                var view = this.dataSource.view();
                for (var i = 0; i < view.length; i++) {
                    if (vm.checkedIds[view[i].id]) {
                        this.tbody.find("tr[data-uid='" + view[i].uid + "']")
                            .addClass("k-state-selected")
                            .find(".ob-selected")
                            .attr("checked", "checked");
                    }
                }
            },
            columns: [
                {
                    field: "period",
                    sortable: true,
                    title: "Period",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    width: 130,
                    template: "<span ng-bind='::dataItem.period'></span>",
                    footerTemplate: '<div class="text-left">Totals</div>',
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Sales Units",
                    field: "total_sold_quantity",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 140,
                    template: function (dataItem) {
                        return ep_decimalFilter(dataItem.total_sold_quantity);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_decimalFilter(dataItem.total_sold_quantity.sum) + "</div>"
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Sales $",
                    field: "total_net_sales",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 130,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.total_net_sales);
                    },
                    aggregates: ["sum"],
                    footerTemplate: '<div class="text-right">#= kendo.toString(sum,"c") #</div>',
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "COGS",
                    field: "cost_of_goods_sold",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 160,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.cost_of_goods_sold);
                    },
                    aggregates: ["sum"],
                    footerTemplate: '<div class="text-right">#= kendo.toString(sum,"c") #</div>',
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Kit Sales Units",
                    field: "kit_sold_quantity",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 180,
                    template: function (dataItem) {
                        return ep_decimalFilter(dataItem.kit_sold_quantity);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_decimalFilter(dataItem.kit_sold_quantity.sum) + "</div>"
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Kit Sales $",
                    field: "kit_net_sales",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 150,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.kit_net_sales);
                    },
                    aggregates: ["sum"],
                    footerTemplate: '<div class="text-right">#= kendo.toString(sum,"c") #</div>',
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },

                {
                    title: "Profit $",
                    field: "gross_profit",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 150,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.gross_profit);
                    },
                    aggregates: ["sum"],
                    footerTemplate: '<div class="text-right">#= kendo.toString(sum,"c") #</div>',
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Purchase Units",
                    field: "total_received_quantity",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 180,
                    template: function (dataItem) {
                        return ep_decimalFilter(dataItem.total_received_quantity);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_decimalFilter(dataItem.total_received_quantity.sum) + "</div>"
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Purchase $",
                    field: "total_received_value",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 160,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.total_received_value);
                    },
                    aggregates: ["sum"],
                    footerTemplate: '<div class="text-right">#= kendo.toString(sum,"c") #</div>',
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Shipper Purchase Units",
                    field: "shipper_received_quantity",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 200,
                    template: function (dataItem) {
                        return ep_decimalFilter(dataItem.shipper_received_quantity);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_decimalFilter(dataItem.shipper_received_quantity.sum) + "</div>"
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Shipper Purchase $",
                    field: "shipper_received_value",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 230,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.shipper_received_value);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_currencyFilter(dataItem.shipper_received_value.sum) + "</div>"
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Adjustment Units",
                    field: "total_adjusted_quantity",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 170,
                    template: function (dataItem) {
                        return ep_decimalFilter(dataItem.total_adjusted_quantity);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_decimalFilter(dataItem.total_adjusted_quantity.sum) + "</div>"
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Adjustment $",
                    field: "total_adjusted_value",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 180,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.total_adjusted_value);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_currencyFilter(dataItem.total_adjusted_value.sum) + "</div>";
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Promotion Units",
                    field: "promotion_quantity",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 180,
                    template: function (dataItem) {
                        return ep_decimalFilter(dataItem.promotion_quantity);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_decimalFilter(dataItem.promotion_quantity.sum) + "</div>"
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Promotion $",
                    field: "promotion_sales",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 160,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.promotion_sales);
                    },
                    aggregates: ["sum"],
                    footerTemplate: '<div class="text-right">#= kendo.toString(sum,"c") #</div>',
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Transfer In Units",
                    field: "transferred_in_quantity",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    attributes: {"class": "ep-table-cell-right"},
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 190,
                    template: function (dataItem) {
                        return ep_decimalFilter(dataItem.transferred_in_quantity);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_decimalFilter(dataItem.transferred_in_quantity.sum) + "</div>";
                    }
                },
                {
                    title: "Transfer In $",
                    field: "transferred_in_value",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    attributes: {"class": "ep-table-cell-right"},
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 190,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.transferred_in_value);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_currencyFilter(dataItem.transferred_in_value.sum) + "</div>";
                    }
                },
                {
                    title: "Transfer Out Units",
                    field: "transferred_out_quantity",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    attributes: {"class": "ep-table-cell-right"},
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 190,
                    template: function (dataItem) {
                        return ep_decimalFilter(dataItem.transferred_out_quantity);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_decimalFilter(dataItem.transferred_out_quantity.sum) + "</div>";
                    }
                },
                {
                    title: "Transfer Out $",
                    field: "transferred_out_value",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    attributes: {"class": "ep-table-cell-right"},
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 190,
                    template: function (dataItem) {
                        return ep_currencyFilter(dataItem.transferred_out_value);
                    },
                    aggregates: ["sum"],
                    footerTemplate: function (dataItem) {
                        return "<div class='text-right'> " + ep_currencyFilter(dataItem.transferred_out_value.sum) + "</div>";
                    }
                }
            ],
            filterable: util.ep_grid_filterable,
            reorderable: util.ep_grid_reorderable,
            resizable: util.ep_grid_resizeable
        };

        vm.launch_default_price_change_log_dialog = function () {
            let _caller_data = {
                product_name: vm.product.sku,
                product_desc: vm.product.description,
                branch_list: vm.item_branch_list,
                item_branch: vm.item.branch,
                product_id: vm.product.id,
                default_price_type_name: vm.system_default_price_type_name,
                stocking_uom: vm.product.stocking_uom_name
            };
            vm.ITR_default_price_change_log_dialog = StdDialog.custom({
                controller_name: 'itr_default_price_change_log_controller',
                scope: $scope,
                create_controller_and_scope: true,
                configure_from_new_controller: true,
                is_keyboard_support_required: true,
                caller_data: _caller_data
            });

        }

        vm.launch_average_cost_update = function () {
            if (unsaved_data_tracker.changes_detected()) {
                StdDialog.information("You have unsaved changes which are about to be lost.Please save your changes.");
                return;
            }

            const _update_cost = function (new_cost) {
                vm.item.costs.average_cost = new_cost;
            };

            const _caller_data = {
                current_avg_cost: angular.copy(vm.item.costs.average_cost),
                item: vm.product.sku,
                description: vm.product.description,
                product_id: vm.product.id,
                branch: vm.item.branch,
                callback: _update_cost
            };

            vm.average_cost_update_dialog = StdDialog.custom({
                controller_name: 'average_cost_update_controller',
                scope: $scope,
                create_controller_and_scope: true,
                configure_from_new_controller: true,
                is_keyboard_support_required: true,
                caller_data: _caller_data
            });
        };

        vm.product_price_book_data_source = new kendo.data.DataSource({
            pageSize: 10
        });

        vm.product_price_book_grid_options = {
            toolbar: [],
            dataBound: function () {
                var grid = this;
                var dataArea;
                var gridElement = angular.element("#product_price_book_grid");
                var grid_name = $("#product_price_book_grid").data("kendoGrid");
                if (grid.dataSource.total() == 0) {
                    if (gridElement) {
                        dataArea = gridElement.find(".k-grid-content");
                        dataArea.height(0);
                    }
                } else {
                    if (gridElement) {
                        dataArea = gridElement.find(".k-grid-content");
                        dataArea.height(util.maintenance_grid_height - 50);
                    }
                }
                util.ep_grid_resize(grid_name);
            },
            columnMenu: util.ep_grid_column_menu,
            resizable: util.ep_grid_resizeable,
            scrollable: util.ep_grid_scrollable,
            pageable: util.ep_grid_pageable_options,
            reorderable: util.ep_grid_reorderable,
            filterable: util.ep_grid_filterable,
            columns: [
                {
                    title: "Price Book",
                    field: "name",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    attributes: {style: "text-align:left"},
                    width: 120,
                    template: "" +
                        "<a href class='k-grid-view' " +
                        "ng-class='{\"disabled_element\": !(product_controller.all_inventory_access_obj.access_price_books)}'" +
                        "ng-click='product_controller.launch_price_book(dataItem.price_book_id)'>" +
                        "<span id='edit_selected_price_book' title='Edit' " +
                        "ng-bind='::dataItem.name'></a>",
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Customers",
                    field: "customers",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    sortable: true,
                    template: "<span ng-bind='::dataItem.customers'></span>",
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 120
                },
                {
                    title: "Customer Price Groups",
                    field: "customer_price_groups",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    sortable: true,
                    template: "<span ng-bind='::dataItem.customer_price_groups'></span>",
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 120
                },
                {
                    title: "Loyalty?",
                    field: "loyalty_book",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    sortable: true,
                    template: "<span ng-bind='::dataItem.loyalty_book'></span>",
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 120
                },
                {
                    title: "Rule Name",
                    field: "rule_name",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    sortable: true,
                    template: "<span ng-bind='::dataItem.rule_name'></span>",
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 100
                },
                {
                    title: "Rule Type",
                    field: "rule_type",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    sortable: true,
                    template: "<span ng-bind='::dataItem.rule_type'></span>",
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 100
                },
                {
                    title: "Calculated Prices",
                    field: "price",
                    headerAttributes: {"class": "ep-table-header-cell"},
                    sortable: false,
                    template: _format_price_book_prices,
                    minResizableWidth: util.ep_grid_column_min_resize_width,
                    width: 250
                }

            ],
            sortable: {
                mode: "single",
                serverSorting: true,
                allowUnsort: false
            },
            selectable: "row"
        };

        vm.item_buying_variant_grid_options = {
            sortable: {
                mode: "single",
                serverSorting: true,
                allowUnsort: false
            },
            pageable: util.ep_grid_pageable_options,
            scrollable: util.ep_grid_scrollable,
            editable: {mode: "incell"},
            save: function (e) {
                $timeout(function () {
                    var gridElement = $("#item_buying_variant_grid");
                    gridElement.data('kendoGrid').dataSource.sync();
                });
            },
            dataBound: function (e) {
                var grid = this;
                var gridElement = $("#item_buying_variant_grid");

                if (gridElement) {
                    var dataArea = gridElement.find(".k-grid-content");
                }

                if (grid.dataSource.total() == 0) {
                    if (gridElement && dataArea) {
                        dataArea.height(0);
                    }
                } else {
                    if (gridElement && dataArea) {
                        dataArea.height(util.maintenance_grid_height);
                    }
                }

                var rows = this.table.find("tr:not(.k-grouping-row)");
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    var model = this.dataItem(row);
                    var my_field_id = parseInt(model.field_id);
                    if (my_field_id >= 10) {
                        for (var c = 0; c < row.childElementCount; c++) {
                            var cell = $($(row).find("td")[c]);
                            cell.addClass("k-group-cell");
                        }
                    }
                }
            },
            filterable: util.ep_grid_filterable,
            reorderable: util.ep_grid_reorderable,
            resizable: util.ep_grid_resizeable
        };

        vm.buying_variant_fields = [
            /*{id: "0", name: "Order Point"},
             {id: "1", name: "Max Stock"},*/
            {id: "10", name: "Quantity On Hand"},
            {id: "11", name: "Quantity Available"},
            {id: "12", name: "Quantity On Order"}
        ];

        vm.buying_variant_fields_data_source = new kendo.data.DataSource();
        for (var i = 0; i < vm.buying_variant_fields.length; i++) {
            vm.buying_variant_fields_data_source.add(vm.buying_variant_fields[i]);
        }

        vm.buying_variant_field_dropdown_options = {};

        vm.buying_variant_field = 10;
        vm.buying_variant_field_name = "Quantity On Hand";
        vm.buying_variant_value_disabled = false;

        vm.pricing_toolbar_template = [
            {
                template:
                    '<kendo-button class="toolbar_icon-state" ng-disabled="true" ng-click="product_controller.item_pricing_variant_export()">' +
                    '<span id="ad_sheet_export_fa" title="Export to Excel" class="fa fa-fw fa-2x fa-file-excel-o"></kendo-button>'
            }
        ];

        vm.item_pricing_variant_grid_options = {
            sortable: {
                mode: "single",
                serverSorting: true,
                allowUnsort: false
            },
            pageable: util.ep_grid_pageable_options,
            scrollable: util.ep_grid_scrollable,
            editable: {mode: "incell"},
            save: function (e) {
                $timeout(function () {
                    var grid = this;
                    var gridElement = $("#item_pricing_variant_grid");
                    gridElement.data('kendoGrid').dataSource.sync();
                });
            },
            dataBound: function (e) {
                var grid = this;
                var gridElement = $("#item_pricing_variant_grid");

                if (gridElement) {
                    var dataArea = gridElement.find(".k-grid-content");
                }

                if (grid.dataSource.total() == 0) {
                    if (gridElement && dataArea) {
                        dataArea.height(0);
                    }
                } else {
                    if (gridElement && dataArea) {
                        dataArea.height(util.maintenance_grid_height);
                    }
                }

                var rows = this.table.find("tr:not(.k-grouping-row)");
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    var model = this.dataItem(row);
                    var my_field_id = parseInt(model.field_id);
                    if (my_field_id >= 10) {
                        for (var c = 0; c < row.childElementCount; c++) {
                            var cell = $($(row).find("td")[c]);
                            cell.addClass("k-group-cell");
                        }
                    }
                }
            },
            filterable: util.ep_grid_filterable,
            reorderable: util.ep_grid_reorderable,
            resizable: util.ep_grid_resizeable
        };

        vm.pricing_variant_fields = [
            {id: "0", name: "Replacement Cost"},
            {id: "1", name: "Selling Price"},
            {id: "10", name: "Average Cost"},
            {id: "11", name: "Last Cost"}
        ];

        vm.pricing_variant_fields_data_source = new kendo.data.DataSource();
        for (i = 0; i < vm.pricing_variant_fields.length; i++) {
            vm.pricing_variant_fields_data_source.add(vm.pricing_variant_fields[i]);
        }

        vm.pricing_variant_field_dropdown_options = {};

        vm.pricing_variant_field = 0;
        vm.pricing_variant_field_name = "Replacement Cost";
        vm.pricing_variant_value_disabled = false;

    }

    function get_shared_data() {
        vm.true_false_data_source = [{value: true, name: 'True'}, {value: false, name: 'False'}];
        vm.true_false_dropdown_options = {};

        vm.selling_price_type_dropdown_options = {};

        vm.selling_price_type_data_source = pricing_sales_price_type_service.get_record_server_filter_data_source(util.ad_find_options(true, false),
            pricing_sales_price_type_service.filter_none(), util.datasource_pagesize, $scope);

        pricing_sales_price_type_service.read_primary(util.ad_find_options(true, false)).then(function (price_type_default) {
            if (price_type_default && price_type_default.length == 1) {
                vm.system_default_price_type = price_type_default[0].id;
                vm.system_default_price_type_name = price_type_default[0].name;
                _set_default_price_type();
            }
        });

        vm.new_product_supplier_data_source = supplier_supplier_with_all_service.get_record_server_filter_data_source(util.ad_find_options(true, false),
            supplier_supplier_with_all_service.filter_supplier_lookup_aspect(), util.datasource_pagesize, $scope);
        vm.new_product_supplier_dropdown_options = {
            optionLabel: " ",
            filter: "startswith",
            //autoBind: false,
            virtual: {
                itemHeight: 60,
                //mapValueTo: "dataItem",
                mapValueTo: "index",
                valueMapper: function (options) {
                    var mapper_data = {
                        key_name: "id",
                        keys: [
                            parseInt(options.value)
                        ]
                    };
                    supplier_value_mapper_index_service.supplier_value_mapper_init_value(mapper_data, supplier_supplier_with_all_service.filter_supplier_lookup_aspect()).then(function (result) {
                        if (result.indexes[0] == null) {
                            result.indexes = [];
                        }
                        options.success(result.indexes);
                    }, function error(reason) {
                    });
                    /*
                     supplier_supplier_service.supplier_value_mapper_init_value(options.value).then(function (result) {
                     options.success(result.results);
                     }, function error(reason) {
                     });
                     */
                }

            },
            template: "<div><div><b>${data.number}</b></div>${data.name}</div>",
            valueTemplate: function (dataItem) {
                return `<span class='two_value_dropdown_code_wrapper'>
                                        <span class='ep-common-two-value ep-common-two-value-dropdown-head'>{[{dataItem.number}]}</span>
                                        <span class='ep-common-two-value ep-common-two-value-dropdown-value'>{[{dataItem.number ? " - " : ""}]}{[{dataItem.name}]}</span>
                                   </span>`;
            }
        };


        vm.product_kit_grid_data_source = new kendo.data.DataSource({
            data: vm.edit_product_kit,
            schema: vm.kit_components_schema,
            pageSize: 10/*,
            serverAggregates: true,
            aggregate:[{field:"quantity", aggregate: "sum"}]*/
        });

        vm.kit_read_function = function (options) {
            options.success(vm.edit_product_kit);
        };

        vm.product_kit_detail_grid_options = {
            toolbar: [
                {
                    template: '<a href ng-click="kit_detail_select_all()">' +
                        '    <span title="Select All" class="fa fa-fw fa-2x fa-check-circle"></span>' +
                        '</a>' +
                        '<a href ng-click="product_controller.edit_kit_detail()"' +
                        '        ng-show="product_controller.show_kit_edit_icon()">' +
                        '    <span title="Edit" class="fa fa-fw fa-2x fa-edit text-primary"></span>' +
                        '</a>' +
                        '<a href ng-click="product_controller.delete_kit_item_detail()"' +
                        '        ng-show="product_controller.show_kit_delete_icon()">' +
                        '    <span title="Delete" class="fa fa-fw fa-2x fa-minus-circle text-danger"></span>' +
                        '</a>'
                }
            ],
            sortable: {
                mode: "single",
                serverSorting: true,
                allowUnsort: false
            },
            pageable: util.ep_grid_pageable_options,
            selectable: "row",
            scrollable: util.ep_grid_scrollable,
            columnMenu: util.ep_grid_column_menu,
            columnHide: function (column) {
                var grid_name = $("#product_kit_detail_grid").data("kendoGrid");
                util.ep_grid_resize(grid_name);
            },
            columnShow: function (column) {
                var grid_name = $("#product_kit_detail_grid").data("kendoGrid");
                util.ep_grid_resize(grid_name);
            },
            columnResize: function (column) {
                var grid_name = $("#product_kit_detail_grid").data("kendoGrid");
                util.ep_grid_resize(grid_name);
            },
            change: function (e) {
                var selected_row = this.select();
                vm.selected_kit_item_detail = this.dataItem(selected_row[0]);
            },
            dataSource: vm.product_kit_grid_data_source,
            dataBound: function (e) {
                var grid = this;
                var gridElement = $("#product_kit_detail_grid");
                var grid_name = $("#product_kit_detail_grid").data("kendoGrid");
                if (gridElement) {
                    var dataArea = gridElement.find(".k-grid-content");
                }
                if (grid.dataSource.total() == 0) {
                    if (gridElement && dataArea) {
                        dataArea.height(0);
                    }
                } else {
                    if (gridElement && dataArea) {
                        dataArea.height(util.maintenance_grid_height);
                    }
                }
                var view = this.dataSource.view();
                for (var i = 0; i < view.length; i++) {
                    if (vm.checkedIds[view[i].id]) {
                        this.tbody.find("tr[data-uid='" + view[i].uid + "']")
                            .addClass("k-state-selected")
                            .find(".ob-selected")
                            .attr("checked", "checked");
                    }
                }
                util.ep_grid_resize(grid_name);
            },
            columns: [
                {id: "id", field: "id", hidden: true},
                {
                    title: "Select",
                    field: "checkbox",
                    headerAttributes: {style: "text-align: center;color: white"},
                    width: 100,
                    template: "<div style='text-align: center'><input name='checkbox' class='ob-selected' ng-click='kit_detail_checked($event, dataItem)' type='checkbox' ></div>",
                    minResizableWidth: util.ep_grid_column_min_resize_width

                },
                {
                    title: "Item",
                    field: "sku",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left"
                    },
                    width: 200,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Description",
                    field: "description",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left"
                    },
                    width: 200,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Qty",
                    field: "quantity",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 100,
                    template: function (dataItem) {
                        return ep_decimalFilter(dataItem.quantity);
                    },
                    /*aggregates: ["sum"],
                    footerTemplate: '<div class="text-center">#= kendo.toString(sum,"c") #</div>',*/
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "UOM",
                    field: "child_uom_code",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left"
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                }
            ],
            filterable: util.ep_grid_filterable,
            reorderable: util.ep_grid_reorderable,
            resizable: util.ep_grid_resizeable
        };

        vm.item_buying_1_variant_grid_data_source = new kendo.data.DataSource({
            data: [],
            schema: vm.item_buying_1_variant_schema,
            pageSize: 5,
            autoSync: true
        });

        vm.item_buying_2_variant_grid_data_source = new kendo.data.DataSource({
            data: [],
            schema: [],
            pageSize: 5,
            autoSync: true
        });

        vm.item_pricing_1_variant_grid_data_source = new kendo.data.DataSource({
            data: [],
            schema: vm.item_pricing_1_variant_schema,
            pageSize: 5,
            autoSync: true
        });

        vm.item_pricing_2_variant_grid_data_source = new kendo.data.DataSource({
            data: [],
            schema: [],
            pageSize: 5,
            autoSync: true
        });

        vm.maintenance_toolbar_search_selected = function (e) {
            var dataItem = angular.isDefined(e.dataItem) ? e.dataItem : e.sender.dataItem(e.item.index());
            clear_product_list();
            if (dataItem) {
                //get_product_record(dataItem.id);
                //vm.focus_sku = true;
                vm.nav_service.clear_navigation(app_name, component_name);
                $location.path('products/productitem/edit/' + dataItem.id);
            }
        };
    }

    vm.format_quantity = function (quantity) {
        if (isNaN(quantity)) {
            return '';
        }
        if (quantity % 1 == 0) {
            return Math.floor(quantity);
        }
        return quantity;
    };

    vm.format_amount = function (amount) {
        if (isNaN(amount)) {
            return '';
        }
        return '$' + (amount * 1.0).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    };

    vm.get_carousel_images = function () {
        vm.carousel_slides = [];
        var currIndex = 0;
        vm.carousel_slides.push({
            image: '/app/shared/images/register-advanced.gif',
            id: currIndex++
        });
        vm.carousel_slides.push({
            image: '/app/shared/images/manage-users-generic.png',
            id: currIndex++
        });
    };

    function highlight_category(flag) {

        if (!flag) {

            vm.tree_component = angular.element("#category_tree_view").data("kendoTreeView");
            vm.tree_component.select(angular.element());
            var UID = null;
            var _target_element = null;

            if (vm.product.category) {
                var target_node_id = vm.product.category;
                _target_element = angular.element('.category_' + target_node_id);
                UID = _target_element.attr('id');

                if (!UID) {
                    // loadOnDemand = false on this tree, so the full hierarchy is not loaded
                    // If the selected category is not loaded, this will use the full tree data
                    // to find all ancestors for the selected category
                    vm.selected_category_ancestors = [];
                    get_ancestors(vm.full_tree_data, target_node_id);
                    vm.selected_category_ancestors.reverse();
                    vm.tree_component.expandPath(vm.selected_category_ancestors);

                    _target_element = angular.element('.category_' + target_node_id);
                    UID = _target_element.attr('id');
                }


                if (UID && UID.length > 0) {

                    var treeScrollTop = $("#category_tree_view").scrollTop();
                    var treeTop = $("#category_tree_view").offset().top;
                    var _offset = (treeScrollTop + _target_element.offset().top) - treeTop;
                    if (_offset > 10) {
                        _offset = _offset - 10;
                    }

                    vm.doing_highlight = true;
                    vm.tree_component.select(vm.tree_component.findByUid(UID));
                    vm.doing_highlight = false;
                    vm.tree_component.expand(_target_element.parents("li"));

                    // if we have far to scroll jump close to the end with no animation prior to
                    // animating so user does not have to wait long
                    if (_offset > 200) {
                        var jump_offset = _offset - 200;
                        $("#category_tree_view").scrollTop(jump_offset);
                    }

                    $("#category_tree_view").animate({scrollTop: _offset});

                    flag = true;
                }
            }
        }
    }

    function highlight_new_item_category(flag) {

        if (!flag) {

            vm.tree_component = angular.element("#new_item_category_tree_view").data("kendoTreeView");
            vm.tree_component.select(angular.element());
            var UID = null;
            var _target_element = null;
            if (vm.new_item_selected_category_id) {

                var target_node_id = vm.new_item_selected_category_id;
                _target_element = angular.element('.new_item_category_' + target_node_id);
                UID = _target_element.attr('id');

                if (!UID) {
                    // loadOnDemand = false on this tree, so the full hierarchy is not loaded
                    // If the selected category is not loaded, this will use the full tree data
                    // to find all ancestors for the selected category
                    vm.selected_category_ancestors = [];
                    get_ancestors(vm.full_tree_data, target_node_id);
                    vm.selected_category_ancestors.reverse();
                    vm.tree_component.expandPath(vm.selected_category_ancestors);

                    _target_element = angular.element('.new_item_category_' + target_node_id);
                    UID = _target_element.attr('id');
                }

                if (UID && UID.length > 0) {
                    var treeScrollTop = $("#new_item_category_tree_view").scrollTop();
                    var treeTop = $("#new_item_category_tree_view").offset().top;
                    var _offset = (treeScrollTop + _target_element.offset().top) - treeTop;
                    if (_offset > 10) {
                        _offset = _offset - 10;
                    }

                    vm.doing_highlight = true;
                    vm.tree_component.select(vm.tree_component.findByUid(UID));
                    vm.doing_highlight = false;
                    //vm.tree_component.expand(_target_element.parents("li"));
                    flag = true;


                    // if we have far to scroll jump close to the end with no animation prior to
                    // animating so user does not have to wait long
                    if (_offset > 200) {
                        var jump_offset = _offset - 200;
                        $("#new_item_category_tree_view").scrollTop(jump_offset);
                    }

                    $("#new_item_category_tree_view").animate({scrollTop: _offset});

                }
            }
        }
    }

    function get_ancestors(children, id) {

        for (var i = 0; i < children.length; i++) {

            if (children[i].id == null) {
                continue;
            }

            if (children[i].id == id) {
                vm.selected_category_ancestors.push(id);
                return true;
            } else if (children[i].has_children) {

                if (get_ancestors(children[i].items, id)) {
                    vm.selected_category_ancestors.push(children[i].id);
                    return true;
                }
            }
        }
        return false;
    }


    vm.alternate_selling_multiple_changed = function (index) {
        var alt_rec = {};
        var multiple_value = vm.alternate_selling_price[index].selling_multiple;
        alt_rec = vm.alternate_selling_price[index];
        if (vm.product.price_type == 2) {
            vm.alternate_selling_price[index].product_gross_profit = vm.calculate_gross_profit(alt_rec.selling_product_amount, alt_rec.selling_price_uom, multiple_value);
        } else {
            vm.alternate_selling_price[index].item_gross_profit = vm.calculate_gross_profit(alt_rec.selling_item_amount, alt_rec.selling_price_uom, multiple_value);
        }

    };

    vm.alternate_amount_changed = function (index) {
        var alt_rec = {};
        alt_rec = vm.alternate_selling_price[index];

        if (vm.alternate_selling_price[index].newly_added == true && vm.alternate_selling_price[index].selling_product_amount == 0.00 && vm.product.price_by != 2) {
            vm.alternate_selling_price[index].selling_product_amount = vm.alternate_selling_price[index].selling_item_amount;
        }
        if (vm.product.price_type == 2) {
            vm.alternate_selling_price[index].product_gross_profit = vm.calculate_gross_profit(alt_rec.selling_product_amount, alt_rec.selling_price_uom, alt_rec.selling_multiple);
        } else {
            vm.alternate_selling_price[index].item_gross_profit = vm.calculate_gross_profit(alt_rec.selling_item_amount, alt_rec.selling_price_uom, alt_rec.selling_multiple);
        }
    };

    const _update_alternate_unit_price = function () {
        //for each and every row get the data Item get the payload and update it for the specified row
        let grid = $("#alternate_unit_grid").data('kendoGrid');
        if (grid) {
            let grid_data = grid.dataSource.data().toJSON();
            _get_latest_price_gp_percentage(grid_data, function (error, response) {
                if (response) {
                    let calculated_data = response.data;
                    let alternate_unit;
                    for (let i = 0; i < calculated_data.length; i++) {
                        alternate_unit = _search_unique_alternate_unit(grid_data, calculated_data[i].price_type_id, calculated_data[i].uom_id);
                        alternate_unit.price = calculated_data[i].alternate_price;
                        alternate_unit.product_gross_profit = calculated_data[i].gp ? calculated_data[i].gp : '0';
                    }
                    let data_source_data = {
                        prices: grid_data
                    };
                    vm.alternate_unit_grid_data_source = product_product_service.get_alternate_unit_grid_data_source(data_source_data, 250, vm.product_stocking_uom, vm.product_stocking_uom_name);
                    grid.setDataSource(vm.alternate_unit_grid_data_source);
                }
            });
        }

    };

    vm.product_selling_amount_changed = function () {
        vm.selling_price.gross_profit = vm.calculate_gross_profit(vm.selling_price.amount, vm.product_selling_uom, vm.product_selling_uom_multiple);
        if (vm.selling_price.amount !== null) {
            _update_alternate_unit_price();
        }
    };

    vm.item_replacement_cost_changed = function () {
        recalculate_gross_profit();
    };

    function recalculate_gross_profit() {
        var alt_rec = {};
        vm.selling_price.gross_profit = vm.calculate_gross_profit(vm.selling_price.amount, vm.product_selling_uom,
            vm.product_selling_uom_multiple);
        for (var x = 0; x < vm.alternate_selling_price.length; x++) {
            alt_rec = vm.alternate_selling_price[x];
            if (vm.product.price_by == 2) {
                vm.alternate_selling_price[x].product_gross_profit = vm.calculate_gross_profit(alt_rec.selling_product_amount, alt_rec.selling_price_uom, alt_rec.selling_multiple);
            } else {
                vm.alternate_selling_price[x].item_gross_profit = vm.calculate_gross_profit(alt_rec.selling_item_amount, alt_rec.selling_price_uom, alt_rec.selling_multiple);
            }

        }
    }

    vm.buying_variant_field_selected = function (event) {
        var field_id = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
        vm.buying_variant_new_value = null;
        var field_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        vm.buying_variant_field_name = field_name;
        vm.item_buying_2_variant_grid_data_source.filter({field: "field_id", operator: "equals", value: field_id});
        if (parseInt(field_id) >= 10) {
            vm.buying_variant_value_disabled = true;
        } else {
            vm.buying_variant_value_disabled = false;
        }
    };

    vm.pricing_variant_field_selected = function (event) {
        var field_id = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
        vm.pricing_variant_new_value = null;
        var field_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        vm.pricing_variant_field_name = field_name;
        vm.item_pricing_2_variant_grid_data_source.filter({field: "field_id", operator: "equals", value: field_id});
        if (parseInt(field_id) >= 10) {
            vm.pricing_variant_value_disabled = true;
        } else {
            vm.pricing_variant_value_disabled = false;
        }
    };

    vm.set_item_variant_grid_options = function () {
        vm.set_item_buying_variant_grid_options();
        vm.set_item_pricing_variant_grid_options();
    };

    function find_buying_variant_value(att_1, att_2, att_3, field_name) {
        var return_value = null;
        if (vm.edit_buying_variant_detail.length > 0) {
            for (var x = 0; vm.edit_buying_variant_detail.length > x; x++) {
                if (vm.edit_buying_variant_detail[x].variant_value_1 == att_1 &&
                    vm.edit_buying_variant_detail[x].variant_value_2 == att_2 &&
                    vm.edit_buying_variant_detail[x].variant_value_3 == att_3) {
                    if (field_name == 0) {
                        return_value = vm.edit_buying_variant_detail[x].order_point;
                    }
                    if (field_name == 1) {
                        return_value = vm.edit_buying_variant_detail[x].max_quantity;
                    }
                    if (field_name == 2) {
                        return_value = vm.edit_buying_variant_detail[x].qoh;
                    }
                    if (field_name == 3) {
                        return_value = vm.edit_buying_variant_detail[x].qav;
                    }
                    if (field_name == 4) {
                        return_value = vm.edit_buying_variant_detail[x].qoo;
                    }
                }
            }
        }
        return (return_value);
    }

    function find_pricing_variant_value(att_1, att_2, att_3, field_name) {
        var return_value = null;
        if (vm.edit_pricing_variant_detail.length > 0) {
            for (var x = 0; vm.edit_pricing_variant_detail.length > x; x++) {
                if (vm.edit_pricing_variant_detail[x].variant_value_1 == att_1 &&
                    vm.edit_pricing_variant_detail[x].variant_value_2 == att_2 &&
                    vm.edit_pricing_variant_detail[x].variant_value_3 == att_3) {
                    if (field_name == 0) {
                        return_value = vm.edit_pricing_variant_detail[x].replacement_cost;
                    }
                    if (field_name == 1) {
                        return_value = vm.edit_pricing_variant_detail[x].selling_price;
                    }
                    if (field_name == 10) {
                        return_value = vm.edit_pricing_variant_detail[x].average_cost;
                    }
                    if (field_name == 11) {
                        return_value = vm.edit_pricing_variant_detail[x].last_cost;
                    }

                }
            }
        }
        return (return_value);
    }


    vm.set_item_buying_variant_grid_options = function () {
        var buying_columns = {};
        var save_grid_values = [];
        var grid = $("#item_buying_variant_grid").data("kendoGrid");
        var x, y, z = 0;
        var use_value = null;

        // If we have defined some attributes then fill the item buying variant grid.
        if (vm.edit_product_attributes) {
            if (vm.edit_product_attributes.length == 0) {
                grid.setOptions({
                    columns: [{id: "variant_value_1", field: "variant_value_1", hidden: true},
                        {
                            title: "",
                            field: "variant_value_1_name",
                            hidden: true,
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-left"
                            },
                            width: '80px'
                        },
                        /*{
                         title: "Order Point",
                         field: "order_point",
                         headerAttributes: {
                         "class": "ep-table-header-cell"
                         },
                         attributes: {
                         "class": "ep-table-cell-right"
                         },
                         width: '80px',
                         template: function(dataItem) {
                         return vm.format_quantity(dataItem.order_point);
                         }
                         },
                         {
                         title: "Max Stock",
                         field: "max_quantity",
                         headerAttributes: {
                         "class": "ep-table-header-cell"
                         },
                         attributes: {
                         "class": "ep-table-cell-right"
                         },
                         width: '80px',
                         template: function(dataItem) {
                         return vm.format_quantity(dataItem.max_quantity);
                         }
                         },
                         */
                        {
                            title: "QOH",
                            field: "qoh",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.qoh);
                            }
                        },
                        {
                            title: "QAV",
                            field: "qav",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.qav);
                            }
                        },
                        {
                            title: "QOO",
                            field: "qoo",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.qoo);
                            }
                        }]
                });
                vm.item_buying_variant_data = [];
                vm.item_buying_1_variant_grid_data_source.data(vm.item_buying_variant_data);
                grid.setDataSource(vm.item_buying_1_variant_grid_data_source);
            } else if (vm.edit_product_attributes.length == 1) {
                grid.setOptions({
                    columns: [
                        {id: "variant_value_1", field: "variant_value_1", hidden: true},
                        {
                            title: vm.edit_product_attributes[0].attribute_name,
                            field: "variant_value_1_name",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-left"
                            },
                            width: '80px'
                        },
                        /*{
                         title: "Order Point",
                         field: "order_point",
                         headerAttributes: {
                         "class": "ep-table-header-cell"
                         },
                         attributes: {
                         "class": "ep-table-cell-right"
                         },
                         width: '80px',
                         template: function(dataItem) {
                         return vm.format_quantity(dataItem.order_point);
                         }
                         },
                         {
                         title: "Max Stock",
                         field: "max_quantity",
                         headerAttributes: {
                         "class": "ep-table-header-cell"
                         },
                         attributes: {
                         "class": "ep-table-cell-right"
                         },
                         width: '80px',
                         template: function(dataItem) {
                         return vm.format_quantity(dataItem.max_quantity);
                         }
                         },
                         */
                        {
                            title: "QOH",
                            field: "qoh",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.qoh);
                            }
                        },
                        {
                            title: "QAV",
                            field: "qav",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.qav);
                            }
                        },
                        {
                            title: "QOO",
                            field: "qoo",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.qoo);
                            }
                        }]
                });

                // Create datasource where row = Attribute Value, order point, max_quantity, qoh
                if (vm.item_buying_variant_data.length > 0) {
                    // User changed the variant values ( added or removed some).  Keep any unsaved
                    // grid edit changes and re-apply them to the newly updated grid.
                    vm.item_buying_1_variant_grid_data_source.sync();
                    save_grid_values = vm.item_buying_variant_data;
                }
                vm.item_buying_variant_data = [];
                // Create datasource with all current attribute values and default field values
                if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0) {
                    for (y = 0; y < vm.edit_product_attributes[0].attribute_working_values.length; y++) {
                        vm.item_buying_variant_data.push({
                            variant_value_1: vm.edit_product_attributes[0].attribute_working_values[y].id,
                            variant_value_1_name: vm.edit_product_attributes[0].attribute_working_values[y].name,
                            qoh: null,
                            order_point: null,
                            max_quantity: null,
                            qav: null,
                            qoo: null
                        });
                    }
                }
                // Update datasource with previously saved values.
                if (vm.edit_buying_variant_detail && vm.edit_buying_variant_detail.length > 0) {
                    var found_record = false;
                    angular.forEach(vm.edit_buying_variant_detail, function (saved_value) {
                        found_record = false;
                        if (saved_value.variant_value_1 == null) {
                            found_record = true;
                        }
                        for (x = 0; x < vm.item_buying_variant_data.length; x++) {
                            if (saved_value.variant_value_1 == vm.item_buying_variant_data[x].variant_value_1) {
                                vm.item_buying_variant_data[x].qav = saved_value.qty_available;
                                vm.item_buying_variant_data[x].order_point = saved_value.order_point;
                                vm.item_buying_variant_data[x].max_quantity = saved_value.max_quantity;
                                vm.item_buying_variant_data[x].qoo = saved_value.qty_on_order;
                                vm.item_buying_variant_data[x].qoh = saved_value.qty_on_hand;
                                found_record = true;
                            }
                        }
                        if (!found_record) {
                            vm.item_buying_variant_data.push({
                                variant_value_1: vm.edit_product_attributes[0].attribute_working_values[0].id,
                                variant_value_1_name: vm.edit_product_attributes[0].attribute_working_values[0].name,
                                qoh: null,
                                order_point: null,
                                max_quantity: null,
                                qav: null,
                                qoo: null
                            });
                        }
                    });
                }

                if (save_grid_values.length > 0) {
                    // Grid had unsaved edits in it.  Now reapply those edits to the new instance of the grid.
                    angular.forEach(save_grid_values, function (saved_value) {
                        for (y = 0; y < vm.item_buying_variant_data.length; y++) {
                            if (vm.item_buying_variant_data[y].variant_value_1 == saved_value.variant_value_1) {
                                vm.item_buying_variant_data[y].qoh = saved_value.qoh;
                                vm.item_buying_variant_data[y].order_point = saved_value.order_point;
                                vm.item_buying_variant_data[y].max_quantity = saved_value.max_quantity;
                                vm.item_buying_variant_data[y].qav = saved_value.qav;
                                vm.item_buying_variant_data[y].qoo = saved_value.qoo;
                            }
                        }
                    });
                }
                vm.item_buying_1_variant_grid_data_source.data(vm.item_buying_variant_data);
                grid.setDataSource(vm.item_buying_1_variant_grid_data_source);

            } else if (vm.edit_product_attributes.length == 2) {
                vm.x_axis_id = vm.edit_product_attributes[1].attribute;
                vm.x_axis = 1;
                vm.y_axis_id = vm.edit_product_attributes[0].attribute;
                vm.y_axis = 0;

                // Create datasource where row = Attribute Value, order point, max_quantity, qoh
                if (vm.item_buying_variant_data.length > 0) {
                    // User changed the variant values ( added or removed some).  Keep any unsaved
                    // grid edit changes and re-apply them to the newly updated grid.
                    vm.item_buying_2_variant_grid_data_source.sync();
                    save_grid_values = vm.item_buying_variant_data;
                }
                vm.item_buying_variant_data = [];
                // Create datasource with all current attribute values and default field values
                // First create the Y values with field names using the working values ( values read from server prior
                // to any screen changes.

                if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0) {
                    for (z = 0; z < vm.buying_variant_fields.length; z++) {
                        for (x = 0; x < vm.edit_product_attributes[vm.y_axis].attribute_working_values.length; x++) {
                            var attribute = vm.edit_product_attributes[vm.y_axis].attribute_working_values;
                            vm.item_buying_variant_data.push({
                                field_id: vm.buying_variant_fields[z].id,
                                field_name: vm.buying_variant_fields[z].name,
                                y_att_id: attribute[x].id,
                                y_att_name: attribute[x].name
                            });

                        }
                    }
                    vm.my_buying_variant_fields = {
                        id: {editable: false, nullable: false},
                        field_id: {editable: false, nullable: false},
                        field_name: {editable: false, nullable: false},
                        y_att_id: {editable: false, nullable: false},
                        y_att_name: {editable: false, nullable: false}

                    };
                    // Now add in the x axis field names using the working values.

                    for (z = 0; z < vm.edit_product_attributes[vm.x_axis].attribute_working_values.length; z++) {
                        for (x = 0; x < vm.item_buying_variant_data.length; x++) {
                            var data_hold = vm.item_buying_variant_data[x];
                            var field_name = 'x_att_id' + z.toString();
                            data_hold[field_name] = vm.edit_product_attributes[vm.x_axis].attribute_working_values[z].id;
                            vm.my_buying_variant_fields[field_name] = {type: "string"};
                            use_value = find_buying_variant_value(data_hold['y_att_id'], data_hold[field_name], null, data_hold['field_id']);
                            field_name = 'x_att_val_id' + z.toString();
                            data_hold[field_name] = use_value;
                            vm.my_buying_variant_fields[field_name] = {type: "string"};
                            data_hold['id'] = x;
                            vm.item_buying_variant_data[x] = data_hold;

                        }

                    }

                    // Todo - Need to figure out how to reapply saved grid values if the grid shrank.
                }

                // Now Build the columns.
                buying_columns = [];
                buying_columns.push(
                    {id: "id", field: "id", hidden: true}
                );
                buying_columns.push({
                    title: vm.edit_product_attributes[0].attribute_name + " / " + vm.edit_product_attributes[1].attribute_name,
                    field: "y_att_name",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left"
                    },
                    width: '80px'
                });
                for (x = 0; x < vm.edit_product_attributes[1].attribute_working_values.length; x++) {

                    field_name = 'x_att_val_id' + x.toString();
                    buying_columns.push({
                        title: vm.edit_product_attributes[1].attribute_working_values[x].name,
                        field: field_name,
                        headerAttributes: {
                            "class": "ep-table-header-cell"
                        },
                        attributes: {
                            "class": "ep-table-cell-right"
                        },
                        width: '80px'
                    });
                }
                grid.setOptions({
                    columns: buying_columns
                });

                vm.my_buying_variant_schema = {
                    model: {
                        id: "id",
                        fields: vm.my_buying_variant_fields
                    }
                };
                vm.reset_buying_variant_data_source();

            } else if (vm.edit_product_attributes.length == 3) {
                // 3 attributes.
                vm.x_axis_id = vm.edit_product_attributes[2].attribute;
                vm.x_axis = 2;
                vm.y_axis_id = vm.edit_product_attributes[0].attribute;
                vm.y_axis = 0;
                vm.y2_axis_id = vm.edit_product_attributes[1].attribute;
                vm.y2_axis = 1;

                // Create datasource where row = Attribute Value, order point, max_quantity, qoh
                if (vm.item_buying_variant_data.length > 0) {
                    // User changed the variant values ( added or removed some).  Keep any unsaved
                    // grid edit changes and re-apply them to the newly updated grid.
                    vm.item_buying_2_variant_grid_data_source.sync();
                    save_grid_values = vm.item_buying_variant_data;
                }
                vm.item_buying_variant_data = [];
                // Create datasource with all current attribute values and default field values
                // First create the Y values with field names using the working values ( values read from server prior
                // to any screen changes.  Y is a combination of two attributes.  y_att_id and y_att_name are the
                // values shown in the grid.  y1_att_id, y1_att_name, y2_att_id and y2_att_name are the separate attributes
                // that make up y_att_id and y_att_name.
                var attribute1 = [];
                var attribute2 = [];
                var combined_id = '';
                var combined_name = '';

                if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0) {
                    for (z = 0; z < vm.buying_variant_fields.length; z++) {
                        // For each field we are displaying....
                        for (x = 0; x < vm.edit_product_attributes[vm.y_axis].attribute_working_values.length; x++) {
                            attribute1 = vm.edit_product_attributes[vm.y_axis].attribute_working_values;
                            for (y = 0; y < vm.edit_product_attributes[vm.y2_axis].attribute_working_values.length; y++) {
                                attribute2 = vm.edit_product_attributes[vm.y2_axis].attribute_working_values;
                                combined_id = attribute1[x].id + '/' + attribute2[y].name;
                                combined_name = attribute1[x].name + '/' + attribute2[y].name;

                                vm.item_buying_variant_data.push({
                                    field_id: vm.buying_variant_fields[z].id,
                                    field_name: vm.buying_variant_fields[z].name,
                                    y_att_id: combined_id,
                                    y_att_name: combined_name,
                                    y1_att_id: attribute1[x].id,
                                    y1_att_name: attribute1[x].name,
                                    y2_att_id: attribute2[y].id,
                                    y2_att_name: attribute2[y].name
                                });
                            }

                        }
                    }
                    vm.my_buying_variant_fields = {
                        id: {editable: false, nullable: false},
                        field_id: {editable: false, nullable: false},
                        field_name: {editable: false, nullable: false},
                        y_att_id: {editable: false, nullable: false},
                        y_att_name: {editable: false, nullable: false},
                        y1_att_id: {editable: false, nullable: false},
                        y1_att_name: {editable: false, nullable: false},
                        y2_att_id: {editable: false, nullable: false},
                        y2_att_name: {editable: false, nullable: false}

                    };
                    // Now add in the x axis field names using the working values.


                    for (z = 0; z < vm.edit_product_attributes[vm.x_axis].attribute_working_values.length; z++) {
                        for (x = 0; x < vm.item_buying_variant_data.length; x++) {
                            data_hold = vm.item_buying_variant_data[x];
                            field_name = 'x_att_id' + z.toString();
                            data_hold[field_name] = vm.edit_product_attributes[vm.x_axis].attribute_working_values[z].id;
                            vm.my_buying_variant_fields[field_name] = {type: "string"};
                            use_value = find_buying_variant_value(data_hold['y1_att_id'], data_hold['y2_att_id'], data_hold[field_name], data_hold['field_id']);
                            field_name = 'x_att_val_id' + z.toString();
                            data_hold[field_name] = use_value;
                            vm.my_buying_variant_fields[field_name] = {type: "string"};
                            data_hold['id'] = x;
                            vm.item_buying_variant_data[x] = data_hold;

                        }

                    }

                    // Todo - Need to figure out how to reapply saved grid values if the grid shrank.
                }

                // Now Build the columns.
                buying_columns = [];
                buying_columns.push(
                    {id: "id", field: "id", hidden: true}
                );
                buying_columns.push({
                    title: vm.edit_product_attributes[vm.y_axis].attribute_name + " / " + vm.edit_product_attributes[vm.y2_axis].attribute_name + " - " + vm.edit_product_attributes[vm.x_axis].attribute_name,
                    field: "y_att_name",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left"
                    },
                    width: '80px'
                });
                for (x = 0; x < vm.edit_product_attributes[vm.x_axis].attribute_working_values.length; x++) {

                    field_name = 'x_att_val_id' + x.toString();
                    buying_columns.push({
                        title: vm.edit_product_attributes[vm.x_axis].attribute_working_values[x].name,
                        field: field_name,
                        headerAttributes: {
                            "class": "ep-table-header-cell"
                        },
                        attributes: {
                            "class": "ep-table-cell-right"
                        },
                        width: '80px'
                    });
                }
                grid.setOptions({
                    columns: buying_columns
                });

                vm.my_buying_variant_schema = {
                    model: {
                        id: "id",
                        fields: vm.my_buying_variant_fields
                    }
                };
                vm.reset_buying_variant_data_source();
            }
        }

    };

    vm.reset_buying_variant_data_source = function () {
        var grid = $("#item_buying_variant_grid").data("kendoGrid");
        vm.item_buying_2_variant_grid_data_source = new kendo.data.DataSource({
            data: vm.item_buying_variant_data,
            schema: vm.my_buying_variant_schema,
            pageSize: vm.item_buying_variant_data.length,
            autoSync: true
        });
        vm.item_buying_2_variant_grid_data_source.filter({
            field: "field_id",
            operator: "equals",
            value: vm.buying_variant_field
        });
        grid.setDataSource(vm.item_buying_2_variant_grid_data_source);
    };

    vm.set_item_pricing_variant_grid_options = function () {
        var pricing_columns = {};
        var save_grid_values = [];
        var grid = $("#item_pricing_variant_grid").data("kendoGrid");
        var x, y, z = 0;
        var use_value = null;

        // If we have defined some attributes then fill the item pricing variant grid.
        if (vm.edit_product_attributes) {
            if (vm.edit_product_attributes.length == 0) {
                grid.setOptions({
                    columns: [
                        {id: "variant_value_1", field: "variant_value_1", hidden: true},
                        {
                            title: "",
                            field: "variant_value_1_name",
                            hidden: true,
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-left"
                            },
                            width: '80px'
                        },
                        {
                            title: "Selling Price",
                            field: "selling_price",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.selling_price);
                            }
                        },
                        {
                            title: "Replacement Cost",
                            field: "replacement_cost",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.replacement_cost);
                            }
                        },
                        {
                            title: "Average Cost",
                            field: "average_cost",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.average_cost);
                            }
                        },
                        {
                            title: "Last Cost",
                            field: "last_cost",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.last_cost);
                            }
                        }]
                });
                vm.item_pricing_variant_data = [];
                vm.item_pricing_1_variant_grid_data_source.data(vm.item_pricing_variant_data);
                grid.setDataSource(vm.item_pricing_1_variant_grid_data_source);

            } else if (vm.edit_product_attributes.length == 1) {
                grid.setOptions({
                    columns: [
                        {id: "variant_value_1", field: "variant_value_1", hidden: true},
                        {
                            title: vm.edit_product_attributes[0].attribute_name,
                            field: "variant_value_1_name",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-left"
                            },
                            width: '80px'
                        },
                        {
                            title: "Selling Price",
                            field: "selling_price",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.selling_price);
                            }
                        },
                        {
                            title: "Replacement Cost",
                            field: "replacement_cost",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.replacement_cost);
                            }
                        },
                        {
                            title: "Average Cost",
                            field: "average_cost",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.average_cost);
                            }
                        },
                        {
                            title: "Last Cost",
                            field: "last_cost",
                            headerAttributes: {
                                "class": "ep-table-header-cell"
                            },
                            attributes: {
                                "class": "ep-table-cell-right"
                            },
                            width: '80px',
                            template: function (dataItem) {
                                return ep_decimalFilter(dataItem.last_cost);
                            }
                        }]
                });

                // Create datasource where row = average cost, replacement cost, last cost, etc
                if (vm.item_pricing_variant_data.length > 0) {
                    // User changed the variant values ( added or removed some).  Keep any unsaved
                    // grid edit changes and re-apply them to the newly updated grid.
                    vm.item_pricing_1_variant_grid_data_source.sync();
                    save_grid_values = vm.item_pricing_variant_data;
                }
                vm.item_pricing_variant_data = [];
                // Create datasource with all current attribute values and default field values
                if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0) {
                    for (y = 0; y < vm.edit_product_attributes[0].attribute_working_values.length; y++) {
                        vm.item_pricing_variant_data.push({
                            variant_value_1: vm.edit_product_attributes[0].attribute_working_values[y].id,
                            variant_value_1_name: vm.edit_product_attributes[0].attribute_working_values[y].name,
                            replacement_cost: null,
                            average_cost: null,
                            last_cost: null,
                            selling_price: null
                        });
                    }
                }
                // Update datasource with previously saved values.
                if (vm.edit_pricing_variant_detail && vm.edit_pricing_variant_detail.length > 0) {
                    var found_record = false;
                    angular.forEach(vm.edit_pricing_variant_detail, function (saved_value) {
                        found_record = false;
                        if (saved_value.variant_value_1 == null) {
                            found_record = true;
                        }
                        for (x = 0; x < vm.item_pricing_variant_data.length; x++) {
                            if (saved_value.variant_value_1 == vm.item_pricing_variant_data[x].variant_value_1) {
                                vm.item_pricing_variant_data[x].replacement_cost = saved_value.replacement_cost;
                                vm.item_pricing_variant_data[x].average_cost = saved_value.average_cost;
                                vm.item_pricing_variant_data[x].last_cost = saved_value.last_cost;
                                vm.item_pricing_variant_data[x].selling_price = saved_value.selling_price;
                                found_record = true;
                            }
                        }
                        if (found_record == false) {
                            vm.item_pricing_variant_data.push({
                                variant_value_1: vm.edit_product_attributes[0].attribute_working_values[0].id,
                                variant_value_1_name: vm.edit_product_attributes[0].attribute_working_values[0].name,
                                replacement_cost: null,
                                average_cost: null,
                                last_cost: null,
                                selling_price: null
                            });
                        }
                    });
                }

                if (save_grid_values.length > 0) {
                    // Grid had unsaved edits in it.  Now reapply those edits to the new instance of the grid.
                    angular.forEach(save_grid_values, function (saved_value) {
                        for (y = 0; y < vm.item_pricing_variant_data.length; y++) {
                            if (vm.item_pricing_variant_data[y].variant_value_1 == saved_value.variant_value_1) {
                                vm.item_pricing_variant_data[y].average_cost = saved_value.average_cost;
                                vm.item_pricing_variant_data[y].replacement_cost = saved_value.replacement_cost;
                                vm.item_pricing_variant_data[y].last_cost = saved_value.last_cost;
                                vm.item_pricing_variant_data[y].selling_price = saved_value.selling_price;
                            }
                        }
                    });
                }
                vm.item_pricing_1_variant_grid_data_source.data(vm.item_pricing_variant_data);
                grid.setDataSource(vm.item_pricing_1_variant_grid_data_source);

            } else if (vm.edit_product_attributes.length == 2) {
                vm.x_axis_id = vm.edit_product_attributes[1].attribute;
                vm.x_axis = 1;
                vm.y_axis_id = vm.edit_product_attributes[0].attribute;
                vm.y_axis = 0;

                // Create datasource where row = Average Cost, Replacement Cost, Last Cost
                if (vm.item_pricing_variant_data.length > 0) {
                    // User changed the variant values ( added or removed some).  Keep any unsaved
                    // grid edit changes and re-apply them to the newly updated grid.
                    vm.item_pricing_2_variant_grid_data_source.sync();
                    save_grid_values = vm.item_pricing_variant_data;
                }
                vm.item_pricing_variant_data = [];
                // Create datasource with all current attribute values and default field values
                // First create the Y values with field names using the working values ( values read from server prior
                // to any screen changes.

                if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0) {
                    for (z = 0; z < vm.pricing_variant_fields.length; z++) {
                        for (x = 0; x < vm.edit_product_attributes[vm.y_axis].attribute_working_values.length; x++) {
                            var attribute = vm.edit_product_attributes[vm.y_axis].attribute_working_values;
                            vm.item_pricing_variant_data.push({
                                field_id: vm.pricing_variant_fields[z].id,
                                field_name: vm.pricing_variant_fields[z].name,
                                y_att_id: attribute[x].id,
                                y_att_name: attribute[x].name
                            });

                        }
                    }
                    vm.my_pricing_variant_fields = {
                        id: {editable: false, nullable: false},
                        field_id: {editable: false, nullable: false},
                        field_name: {editable: false, nullable: false},
                        y_att_id: {editable: false, nullable: false},
                        y_att_name: {editable: false, nullable: false}

                    };
                    // Now add in the x axis field names using the working values.
                    for (z = 0; z < vm.edit_product_attributes[vm.x_axis].attribute_working_values.length; z++) {
                        for (x = 0; x < vm.item_pricing_variant_data.length; x++) {
                            var data_hold = vm.item_pricing_variant_data[x];
                            var field_name = 'x_att_id' + z.toString();
                            data_hold[field_name] = vm.edit_product_attributes[vm.x_axis].attribute_working_values[z].id;
                            vm.my_pricing_variant_fields[field_name] = {type: "string"};
                            use_value = find_pricing_variant_value(data_hold['y_att_id'], data_hold[field_name], null, data_hold['field_id']);
                            field_name = 'x_att_val_id' + z.toString();
                            data_hold[field_name] = use_value;
                            vm.my_pricing_variant_fields[field_name] = {type: "string"};
                            data_hold['id'] = x;
                            vm.item_pricing_variant_data[x] = data_hold;

                        }

                    }

                    // Todo - Need to figure out how to reapply saved grid values if the grid shrank.
                }

                // Now Build the columns.
                pricing_columns = [];
                pricing_columns.push(
                    {id: "id", field: "id", hidden: true}
                );
                pricing_columns.push({
                    title: vm.edit_product_attributes[0].attribute_name + " / " + vm.edit_product_attributes[1].attribute_name,
                    field: "y_att_name",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left"
                    },
                    width: '80px'
                });
                for (x = 0; x < vm.edit_product_attributes[1].attribute_working_values.length; x++) {

                    field_name = 'x_att_val_id' + x.toString();
                    pricing_columns.push({
                        title: vm.edit_product_attributes[1].attribute_working_values[x].name,
                        field: field_name,
                        headerAttributes: {
                            "class": "ep-table-header-cell"
                        },
                        attributes: {
                            "class": "ep-table-cell-right"
                        },
                        width: '80px'
                    });
                }
                grid.setOptions({
                    columns: pricing_columns
                });

                vm.my_pricing_variant_schema = {
                    model: {
                        id: "id",
                        fields: vm.my_pricing_variant_fields
                    }
                };
                vm.reset_pricing_variant_data_source();

            } else if (vm.edit_product_attributes.length == 3) {
                // 3 attributes.
                vm.x_axis_id = vm.edit_product_attributes[2].attribute;
                vm.x_axis = 2;
                vm.y_axis_id = vm.edit_product_attributes[0].attribute;
                vm.y_axis = 0;
                vm.y2_axis_id = vm.edit_product_attributes[1].attribute;
                vm.y2_axis = 1;

                // Create datasource where row = average cost, replacement cost, etc
                if (vm.item_pricing_variant_data.length > 0) {
                    // User changed the variant values ( added or removed some).  Keep any unsaved
                    // grid edit changes and re-apply them to the newly updated grid.
                    vm.item_pricing_2_variant_grid_data_source.sync();
                    save_grid_values = vm.item_pricing_variant_data;
                }
                vm.item_pricing_variant_data = [];
                // Create datasource with all current attribute values and default field values
                // First create the Y values with field names using the working values ( values read from server prior
                // to any screen changes.  Y is a combination of two attributes.  y_att_id and y_att_name are the
                // values shown in the grid.  y1_att_id, y1_att_name, y2_att_id and y2_att_name are the separate attributes
                // that make up y_att_id and y_att_name.
                var attribute1 = [];
                var attribute2 = [];
                var combined_id = '';
                var combined_name = '';

                if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0) {
                    for (z = 0; z < vm.pricing_variant_fields.length; z++) {
                        // For each field we are displaying....
                        for (x = 0; x < vm.edit_product_attributes[vm.y_axis].attribute_working_values.length; x++) {
                            attribute1 = vm.edit_product_attributes[vm.y_axis].attribute_working_values;
                            for (y = 0; y < vm.edit_product_attributes[vm.y2_axis].attribute_working_values.length; y++) {
                                attribute2 = vm.edit_product_attributes[vm.y2_axis].attribute_working_values;
                                combined_id = attribute1[x].id + '/' + attribute2[y].name;
                                combined_name = attribute1[x].name + '/' + attribute2[y].name;

                                vm.item_pricing_variant_data.push({
                                    field_id: vm.pricing_variant_fields[z].id,
                                    field_name: vm.pricing_variant_fields[z].name,
                                    y_att_id: combined_id,
                                    y_att_name: combined_name,
                                    y1_att_id: attribute1[x].id,
                                    y1_att_name: attribute1[x].name,
                                    y2_att_id: attribute2[y].id,
                                    y2_att_name: attribute2[y].name
                                });
                            }

                        }
                    }
                    vm.my_pricing_variant_fields = {
                        id: {editable: false, nullable: false},
                        field_id: {editable: false, nullable: false},
                        field_name: {editable: false, nullable: false},
                        y_att_id: {editable: false, nullable: false},
                        y_att_name: {editable: false, nullable: false},
                        y1_att_id: {editable: false, nullable: false},
                        y1_att_name: {editable: false, nullable: false},
                        y2_att_id: {editable: false, nullable: false},
                        y2_att_name: {editable: false, nullable: false}

                    };
                    // Now add in the x axis field names using the working values.

                    for (z = 0; z < vm.edit_product_attributes[vm.x_axis].attribute_working_values.length; z++) {
                        for (x = 0; x < vm.item_pricing_variant_data.length; x++) {
                            data_hold = vm.item_pricing_variant_data[x];
                            field_name = 'x_att_id' + z.toString();
                            data_hold[field_name] = vm.edit_product_attributes[vm.x_axis].attribute_working_values[z].id;
                            vm.my_pricing_variant_fields[field_name] = {type: "string"};
                            use_value = find_pricing_variant_value(data_hold['y1_att_id'], data_hold['y2_att_id'], data_hold[field_name], data_hold['field_id']);
                            field_name = 'x_att_val_id' + z.toString();
                            data_hold[field_name] = use_value;
                            vm.my_pricing_variant_fields[field_name] = {type: "string"};
                            data_hold['id'] = x;
                            vm.item_pricing_variant_data[x] = data_hold;

                        }

                    }

                    // Todo - Need to figure out how to reapply saved grid values if the grid shrank.
                }

                // Now Build the columns.
                pricing_columns = [];
                pricing_columns.push(
                    {id: "id", field: "id", hidden: true}
                );
                pricing_columns.push({
                    title: vm.edit_product_attributes[vm.y_axis].attribute_name + " / " + vm.edit_product_attributes[vm.y2_axis].attribute_name + " - " + vm.edit_product_attributes[vm.x_axis].attribute_name,
                    field: "y_att_name",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left"
                    },
                    width: '80px'
                });
                for (x = 0; x < vm.edit_product_attributes[vm.x_axis].attribute_working_values.length; x++) {

                    field_name = 'x_att_val_id' + x.toString();
                    pricing_columns.push({
                        title: vm.edit_product_attributes[vm.x_axis].attribute_working_values[x].name,
                        field: field_name,
                        headerAttributes: {
                            "class": "ep-table-header-cell"
                        },
                        attributes: {
                            "class": "ep-table-cell-right"
                        },
                        width: '80px'
                    });
                }
                grid.setOptions({
                    columns: pricing_columns
                });

                vm.my_pricing_variant_schema = {
                    model: {
                        id: "id",
                        fields: vm.my_pricing_variant_fields
                    }
                };
                vm.reset_pricing_variant_data_source();
            }
        }

    };

    vm.reset_pricing_variant_data_source = function () {
        var grid = $("#item_pricing_variant_grid").data("kendoGrid");
        vm.item_pricing_2_variant_grid_data_source = new kendo.data.DataSource({
            data: vm.item_pricing_variant_data,
            schema: vm.my_pricing_variant_schema,
            pageSize: vm.item_pricing_variant_data.length,
            autoSync: true
        });
        vm.item_pricing_2_variant_grid_data_source.filter({
            field: "field_id",
            operator: "equals",
            value: vm.pricing_variant_field
        });
        grid.setDataSource(vm.item_pricing_2_variant_grid_data_source);
    };

    vm.btnSetAll_clicked = function () {
        //Should we verify what they are doing before doing it?
        if (vm.buying_variant_new_value && vm.buying_variant_new_value.length == 0) {
            StdDialog.question('Are you sure you wish to set all displayed values of ' + vm.buying_variant_field_name.toString() + ' to blank?', 'Set Fields',
                vm.buying_variant_update_fields_answered, $scope);
        } else {
            StdDialog.question('Are you sure you wish to set all displayed values of ' + vm.buying_variant_field_name.toString() + ' to ' + vm.buying_variant_new_value.toString() + '?', 'Set Fields',
                vm.buying_variant_update_fields_answered, $scope);
        }
    };

    vm.buying_variant_update_fields_answered = function (update_fields) {
        if (update_fields) {
            // Determine which field is displayed.
            var field_name = "";
            vm.item_buying_2_variant_grid_data_source.sync();
            for (var x = 0; x < vm.item_buying_variant_data.length; x++) {
                if (vm.item_buying_variant_data[x].field_id == vm.buying_variant_field) {
                    var data_hold = vm.item_buying_variant_data[x];
                    for (var z = 0; z < vm.edit_product_attributes[1].attribute_working_values.length; z++) {
                        field_name = 'x_att_val_id' + z.toString();
                        data_hold[field_name] = vm.buying_variant_new_value;
                        vm.item_buying_variant_data[x] = data_hold;
                    }
                }
            }

            vm.reset_buying_variant_data_source();
        }
    };

    vm.btnSetAllPricing_clicked = function () {
        //Should we verify what they are doing before doing it?
        if (parseInt(vm.pricing_variant_field) >= 10) {
            StdDialog.information('This field is a view only field.', 'Set Fields');
        } else {
            if (vm.pricing_variant_new_value && vm.pricing_variant_new_value.length == 0) {
                StdDialog.question('Are you sure you wish to set all displayed values of ' + vm.pricing_variant_field_name.toString() + ' to blank?', 'Set Fields',
                    vm.pricing_variant_update_fields_answered, $scope);
            } else {
                StdDialog.question('Are you sure you wish to set all displayed values of ' + vm.pricing_variant_field_name.toString() + ' to ' + vm.pricing_variant_new_value.toString() + '?', 'Set Fields',
                    vm.pricing_variant_update_fields_answered, $scope);
            }
        }
    };

    vm.pricing_variant_update_fields_answered = function (update_fields) {
        if (update_fields) {
            // Determine which field is displayed.
            var field_name = "";
            vm.item_pricing_2_variant_grid_data_source.sync();
            for (var x = 0; x < vm.item_pricing_variant_data.length; x++) {
                if (vm.item_pricing_variant_data[x].field_id == vm.pricing_variant_field) {
                    var data_hold = vm.item_pricing_variant_data[x];
                    for (var z = 0; z < vm.edit_product_attributes[1].attribute_working_values.length; z++) {
                        field_name = 'x_att_val_id' + z.toString();
                        data_hold[field_name] = vm.pricing_variant_new_value;
                        vm.item_pricing_variant_data[x] = data_hold;
                    }
                }
            }

            vm.reset_pricing_variant_data_source();
        }
    };

    vm.open_prompt_dialog = function (config) {
        vm.promt_config = config;
        const _cancel_button_clicked = function () {
            vm.gerneric_product_dialog.close();
        };
        var buttons = [
            {
                text: (config.done_callback) ? 'Cancel' : 'Close',
                primary: (config.done_callback) ? false : true,
                callback: config.cancel_call_back ? config.cancel_call_back : _cancel_button_clicked
            }

        ];
        if (config.done_callback) {
            buttons.push({
                text: "Ok",
                primary: true,
                callback: config.done_callback
            });
        }

        vm.gerneric_product_dialog = StdDialog.custom({
            title: config.title,
            templateUrl: '/app/product/product_maintenance/views/templates/generic_product_prompt_dialog.html',
            icon: "fa fa-fw fa-cubes",
            controller_name: 'product_controller',
            scope: $scope,
            windowClass: 'ep-alert-override-modal',
            auto_close: false,
            size: 'md',
            show_footer: true,
            buttons: buttons,
            is_keyboard_support_required: true,
            back_action: _cancel_button_clicked,
        });
    };
    const chk_price = function (val) {
        for (var j = 0; j < val.length; j++) {
            if (val[j].price) {
                return true;
            }
        }
        return false;
    };
    const chk_supp = function (sup) {
        if (sup) {
            for (var j = 0; j < sup.length; j++) {
                if (sup[j].replacement_cost && sup[j].is_primary) {
                    return true;
                }
            }
        }
        return false;
    };
    const is_cost_value_exist = function () {
        if (vm.selling_price.amount || vm.selling_price.product_amount) {
            return true;
        }
        for (var i = 0; i < vm.product.item_details.length; i++) {
            var val = vm.product.item_details[i].prices;
            var sup = vm.product.item_details[i].buying.suppliers;
            var is_price = chk_price(val);
            if (is_price) {
                return true;
            }
            var is_cost = chk_supp(sup);
            if (is_cost) {
                return true;
            }

        }
        return false;

    };
    const _clear_cost_values = function () {
        vm.gerneric_product_dialog.close();
        vm.item.costs.keep_running_cost = false;
    };
    const _cancel_cost_values = function () {
        vm.gerneric_product_dialog.close();
        vm.product.price_by = vm.promt_config.old_val;
    };


    // INV-87 - new code for Product History
    vm.set_item_history_data_source = function () {

        if (vm.product.id && vm.item.branch) {
            vm.history_filter_parameters = {
                product: vm.product.id,
                branches: vm.item.branch,
                period: vm.history_time_type
            };

            vm.item_history_grid_data_source = product_history_service.get_server_filter_aggregate_data_source(util.ad_find_options(true, false),
                product_history_service.filter_product_history(vm.history_filter_parameters), 31, $scope,
                vm.history_model, vm.history_aggregate);
        }
    };

    vm.product_price_by_selected = function (event) {

        vm.prev_price_by = parseInt(event.sender.value());
        var price_by = event.dataItem.id;
        _set_default_price_type();
        if (price_by === prompt_price_tye) {
            if (vm.product.product_type === product_kit || vm.product.product_type === product_shipper) {
                event.preventDefault();
                var val = (vm.product.product_type === product_kit) ? 'Kit' : 'Shipper';
                let config = {
                    title: 'Item type of  ' + val,
                    inline_error_msg: 'This item is a ' + val + ' and cannot be set to prompt for price.'
                };
                vm.open_prompt_dialog(config);
            } else if (vm.product.kit_member == true || vm.product.shipper_member.shipper_member == true) {
                event.preventDefault();
                var val = (vm.product.kit_member) ? 'Kit' : 'Shipper';
                let config = {
                    title: 'Component of a ' + val,
                    inline_error_msg: 'This item is currently a component of a ' + val + ' and cannot be set to prompt for price.'
                };
                vm.open_prompt_dialog(config);
            } else if (is_cost_value_exist()) {
                let config = {
                    title: 'Cost Values Exist for this Item',
                    inline_error_msg: 'Changing this item to Prompt for Price , will clear the current Retail price and any ' +
                        'alternate pricing that are currently associated to this item, ' +
                        'as well as clearing the cost value for any associated suppliers. Once applied, ' +
                        'the previous values cannot be reapplied automatically.',
                    old_val: vm.prev_price_by,
                    cancel_call_back: _cancel_cost_values,
                    done_callback: _clear_cost_values


                };
                vm.open_prompt_dialog(config);
            }

        } else if (price_by !== 2) {
            // Copy all of the current screen prices from product level to item level.
            var amount = vm.selling_price.amount;
            vm.selling_price.amount = vm.selling_price.product_amount;
            if (vm.product.product_type === product_kit && parseFloat(amount) !== parseFloat(vm.selling_price.amount) && vm.product.kit_price_option === 0) {
                _get_components_details(vm.product.id, vm.item.branch, vm.product.kit_components, vm.selling_price.amount);
            }
            if (vm.current_price_by == 2) {
                vm.selling_price.id = null;
                angular.forEach(vm.alternate_unit_grid_data_source.data(), function (alt) {
                    alt.selling_item_amount = alt.selling_product_amount;
                    alt.id = null;
                });
            }
        } else {
            // Copy all of the current screen prices from item level to product level.
            vm.selling_price.product_amount = vm.selling_price.amount;
            vm.alternate_selling_price = vm.alternate_unit_grid_data_source.data().toJSON();
            angular.forEach(vm.alternate_selling_price, function (alt) {
                alt.selling_product_amount = alt.selling_item_amount;
            });
        }
        if (vm.product.product_type === product_kit) {
            $scope.$broadcast("enable_reset");
        }
    };

    vm.item_label_count_type_selected = function (event) {
        var label_type = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
        if (label_type != 3) {
            vm.item.selling.label_count = null;
        }
    };

    vm.set_attribute_value_data_sources = function () {
        var attribute_count = 0;
        vm.product_variant_1_attribute = null;
        vm.product_variant_2_attribute = null;
        vm.product_variant_3_attribute = null;
        if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0) {
            angular.forEach(vm.edit_product_attributes, function (attribute_record) {
                if (attribute_count == 0) {
                    vm.attribute_value_1_data_source.data(attribute_record.attribute_working_values);
                    vm.product_variant_1_attribute = attribute_record.attribute;
                    attribute_count += 1;
                } else if (attribute_count == 1) {
                    vm.attribute_value_2_data_source.data(attribute_record.attribute_working_values);
                    vm.product_variant_2_attribute = attribute_record.attribute;
                    attribute_count += 1;
                } else if (attribute_count == 2) {
                    vm.attribute_value_3_data_source.data(attribute_record.attribute_working_values);
                    vm.product_variant_3_attribute = attribute_record.attribute;
                    attribute_count += 1;
                }
            });
        }


    };

    vm.set_product_prices = function () {
        vm.alternate_selling_price = [];
        vm.selling_price = {};
        vm.selling_price.price_type = null;
        vm.selling_price.selling_price_uom = null;
        vm.selling_price.selling_price_uom_name = "";
        vm.selling_price.amount = 0.00;
        vm.selling_price.gross_profit = 0.00;
        vm.selling_price.product_price = 0;
        vm.is_active = false;

        if (vm.product.price_by != 2) {
            //Pricing not kept by store defaults the in-use to true for all items.
            vm.is_active = true;
        }
        // Main prices are kept in the Product level record.
        if (vm.product.product_variants && vm.variant_main_id >= 0) {
            angular.forEach(vm.product.product_variants[vm.variant_main_id].product_prices, function (price_record) {
                if (price_record.is_default == true) {
                    vm.selling_price.price_type = price_record.price_type;
                    vm.selling_price.selling_price_uom = price_record.uom;
                    vm.selling_price.selling_price_uom_name = price_record.uom_name;
                    vm.selling_price.selling_multiple = price_record.selling_multiple;
                    vm.selling_price.amount = price_record.price;
                    //vm.selling_price.price = price_record.price; //INV-370 - Added for Selling price calculation
                    vm.selling_price.product_amount = price_record.price;
                    vm.selling_price.id = price_record.id;
                    vm.selling_price.product_price = price_record.id;

                    //INV-370 for Alternate selling unit grid implementation
                    vm.selling_price.price_method = price_record.price_method;
                    vm.selling_price.price_method_name = price_record.price_method_name;
                    vm.selling_price.rounding_method = price_record.rounding_method;
                    vm.selling_price.rounding_method_name = price_record.rounding_method_name;
                    if (price_record.price_method === 2) {
                        vm.selling_price.markup_price = price_record.markup_from_retail_percent;
                    } else if (price_record.price_method === 1) {
                        vm.selling_price.markup_price = price_record.discount_off_retail_percent;
                    } else {
                        vm.selling_price.markup_price = null;
                    }
                } else {
                    var markup_price = null;
                    if (price_record.price_method === 2) {
                        markup_price = price_record.markup_from_retail_percent;
                    } else if (price_record.price_method === 1) {
                        markup_price = price_record.discount_off_retail_percent;
                    }

                    vm.alternate_selling_price.push({
                        price_type: price_record.price_type,
                        uom: price_record.uom,
                        is_default: false,
                        selling_price_uom: price_record.uom,
                        selling_price_uom_name: price_record.uom_name,
                        price: price_record.price,
                        selling_product_amount: price_record.price,
                        selling_multiple: price_record.selling_multiple,
                        product_price: price_record.id,
                        id: price_record.id,
                        item_gross_profit: 0.00,
                        selling_item_amount: 0.00,
                        product_gross_profit: 0.00,
                        is_active: vm.is_active,
                        newly_added: false,
                        default_text: price_record.default_text,

                        //INV-370 for Alternate selling unit grid implementation
                        price_method: price_record.price_method,
                        price_method_name: price_record.price_method_name,
                        rounding_method: price_record.rounding_method,
                        rounding_method_name: price_record.rounding_method_name,
                        discount_off_retail_percent: price_record.discount_off_retail_percent,
                        markup_from_retail_percent: price_record.markup_from_retail_percent,
                        markup_price: markup_price,
                        temp_id: price_record.temp_id
                    });
                }
            });
        }
        vm.selling_price.price_type = vm.system_default_price_type;
        vm.selling_price.selling_price_uom = vm.product_selling_uom;
        vm.selling_price.selling_price_uom_name = vm.product_selling_uom_name;
        vm.selling_price.selling_multiple = vm.product_selling_uom_multiple;

    };

    vm.set_item_prices = function () {
        var found_default = false;
        if (vm.product.price_by != 2) {  // Store level pricing

            if (vm.item.prices) {

                angular.forEach(vm.item.prices, function (price_record) {
                    if (price_record.variant == vm.variant_main_value) {
                        if (price_record.is_default == true) {
                            found_default = true;
                            vm.selling_price.price_type = price_record.price_type;
                            vm.selling_price.selling_price_uom = price_record.uom;
                            vm.selling_price.amount = price_record.price;
                            //vm.selling_price.price = price_record.price; //INV-370 - Added for Selling price calculation
                            vm.selling_price.selling_multiple = price_record.selling_multiple;
                            vm.selling_price.gross_profit = 0.00;
                            vm.selling_price.id = price_record.id;
                            vm.selling_price.product_price = price_record.product_price;

                            //INV-370 for Alternate selling unit grid implementation
                            vm.selling_price.price_method = price_record.price_method;
                            vm.selling_price.price_method_name = price_record.price_method_name;
                            vm.selling_price.rounding_method = price_record.rounding_method;
                            vm.selling_price.rounding_method_name = price_record.rounding_method_name;

                            if (price_record.price_method === 2) {
                                vm.selling_price.markup_price = price_record.markup_from_retail_percent;
                            } else if (price_record.price_method === 1) {
                                vm.selling_price.markup_price = price_record.discount_off_retail_percent;
                            } else {
                                vm.selling_price.markup_price = null;
                            }
                        } else {
                            if (price_record.is_active) {
                                vm.is_active = price_record.is_active;
                            } else {
                                vm.is_active = false;
                            }

                            if (vm.alternate_selling_price && vm.alternate_selling_price.length > 0) {
                                for (var x = 0; x < vm.alternate_selling_price.length; x++) {
                                    if ((vm.alternate_selling_price[x].id == price_record.product_price)) {
                                        vm.alternate_selling_price[x].selling_item_amount = price_record.price;
                                        //vm.alternate_selling_price[x].price = price_record.price; //INV-370 - Added for Selling price calculation
                                        vm.alternate_selling_price[x].id = price_record.id;
                                        vm.alternate_selling_price[x].product_price = price_record.product_price;
                                        vm.alternate_selling_price[x].item_gross_profit = 0.00;
                                        vm.alternate_selling_price[x].newly_added = false;
                                        vm.alternate_selling_price[x].default_text = price_record.default_text;

                                        //INV-370 for Alternate selling unit grid implementation
                                        vm.alternate_selling_price[x].price_method = price_record.price_method;
                                        vm.alternate_selling_price[x].price_method_name = price_record.price_method_name;
                                        vm.alternate_selling_price[x].rounding_method = price_record.rounding_method;
                                        vm.alternate_selling_price[x].rounding_method_name = price_record.rounding_method_name;
                                        if (price_record.price_method === 2) {
                                            vm.alternate_selling_price[x].markup_price = price_record.markup_from_retail_percent;
                                        } else if (price_record.price_method === 1) {
                                            vm.alternate_selling_price[x].markup_price = price_record.discount_off_retail_percent;
                                        } else {
                                            vm.alternate_selling_price[x].markup_price = null;
                                        }
                                    }
                                }
                            } else {
                                var markup_price = null;
                                if (price_record.price_method === 2) {
                                    markup_price = price_record.markup_from_retail_percent;
                                } else if (price_record.price_method === 1) {
                                    markup_price = price_record.discount_off_retail_percent;
                                }

                                vm.alternate_selling_price.push({
                                    price_type: price_record.price_type,
                                    uom: price_record.uom,
                                    is_default: false,
                                    selling_price_uom: price_record.uom,
                                    selling_price_uom_name: price_record.selling_price_uom_name,
                                    price: price_record.price,
                                    selling_item_amount: price_record.price,
                                    selling_product_amount: price_record.price,
                                    selling_multiple: price_record.selling_multiple,
                                    id: price_record.id,
                                    product_price: price_record.product_price,
                                    item_gross_profit: 0.00,
                                    newly_added: false,
                                    default_text: price_record.default_text,
                                    //INV-370 for Alternate selling unit grid implementation
                                    price_method: price_record.price_method,
                                    temp_id: price_record.temp_id,
                                    price_method_name: price_record.price_method_name,
                                    rounding_method: price_record.rounding_method,
                                    rounding_method_name: price_record.rounding_method_name,
                                    markup_price: markup_price
                                });
                            }
                        }
                    }
                });
                if (!found_default) {
                    // Need to update the currently display default record so it gets added.
                    vm.selling_price.id = null;
                }
            }

        }
        /*if (vm.item && vm.item.stocking){
         vm.item.stocking.uom_code = "";
         if (vm.item.stocking.stocking_uom && vm.item.stocking.stocking_uom > 0) {
         if (vm.item.stocking.available_uoms && vm.item.stocking.available_uoms.length > 0){
         angular.forEach(vm.item.stocking.available_uoms, function(avail_uoms){
         if (avail_uoms.id ===vm.item.stocking.stocking_uom){
         vm.item.stocking.uom_code = avail_uoms.name;
         }
         });
         }
         }
         }*/
        if (vm.item && vm.item.costs && vm.item.costs.length > 0) {
            for (var z = 0; vm.item.costs.length > z; z++) {
                if (vm.item.costs[z].variant == vm.variant_main_value) {
                    vm.item.costs.replacement_cost = vm.item.costs[z].replacement_cost;
                    vm.item.costs.average_cost = vm.item.costs[z].average_cost;
                    vm.item.costs.last_received_cost = vm.item.costs[z].last_received_cost;
                    vm.item.costs.keep_running_cost = vm.item.costs[z].keep_running_cost;
                    vm.item.costs.running_cost = vm.item.costs[z].running_cost;
                }
            }

        }
        if (vm.item.costs && vm.product.product_type === product_donation) {
            vm.item.costs.keep_running_cost = 0;
        }

        recalculate_gross_profit();
    };

    vm.check_item_uoms_validity = function () {
        var valid = true;
        var error_message = "";
        if (vm.item.item_uoms) {
            angular.forEach(vm.item.item_uoms, function (item_uom) {
                // update with values from the screen.
                if (vm.item_purchase_uom.uom_detail_id) {
                    if (item_uom.uom_code == vm.item_purchase_uom.uom_code) {
                        item_uom.can_purchase = true;
                        item_uom.is_default_purchasing_uom = true;
                        item_uom.max_quantity = vm.item_max_quantity;
                        item_uom.order_point = vm.item_order_point;
                    } else {
                        item_uom.is_default_purchasing_uom = false;
                    }
                }
                if (vm.item_sell_uom.uom_detail_id) {
                    if (item_uom.uom_code == vm.item_sell_uom.uom_code) {
                        item_uom.can_sell = true;
                        item_uom.is_default_selling_uom = true;
                    } else {
                        item_uom.is_default_selling_uom = false;
                    }
                }

                if (vm.item_stock_uom.uom_detail_id) {
                    if (item_uom.uom_code == vm.item_stock_uom.uom_code) {
                        item_uom.can_stock = true;
                        item_uom.is_stocking_uom = true;
                    } else {
                        item_uom.is_stocking_uom = false;
                    }
                }
            });
        }
        if (error_message) {
            StdDialog.error(error_message);
        }
        return valid;
    };

    function get_product_uom_id(passed_uom_code) {
        var new_uom_detail_id = -1;
        if (passed_uom_code) {
            if (vm.product.product_uoms) {
                angular.forEach(vm.product.product_uoms, function (product_uom) {
                    if (product_uom.uom_code == passed_uom_code) {
                        new_uom_detail_id = product_uom.id;
                    }
                });
            }
        }
        return (new_uom_detail_id);
    }

    vm.update_item_uoms_with_product_uom = function () {
        var item_product_uom = -1;
        if (vm.item.item_uoms) {
            angular.forEach(vm.item.item_uoms, function (item_uom) {
                // update with values from the screen.
                if (!item_uom.product_uom) {
                    item_product_uom = get_product_uom_id(item_uom.uom_code);
                    if (item_product_uom >= 0) {
                        item_uom.product_uom = item_product_uom;
                    }
                }

            });
        }
    };

    vm.product_kit_lookup_options = {
        height: 300,
        open: function (e) {
            //this.list.width("500px")
        },
        highlightFirst: true,
        headerTemplate: "<div class='noDataMessage'>No Results Found</div>",
        template: "<div style='line-height: 1.2;'><b>${ data.sku }</b><p style='white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'>${ data.description }</p></div>",
        dataBound: function (e) {
            var noItems = this.list.find(".noDataMessage");
            if (!this.dataSource.view()[0]) {
                noItems.show();
                this.popup.close();
                this.popup.open();
            } else {
                noItems.hide();
            }
        },
        close: function (e) {
            var widget = e.sender;
            if (!widget.shouldClose && !this.dataSource.view()[0]) {
                e.preventDefault();
            }
        },
        filtering: function (e) {
            if (!e.filter.value) {
                e.preventDefault();
                this.popup.close();
                $timeout(function () {
                    vm.focus_product_kit_search = true;
                });
            }
        }
    };

    vm.add_attribute_value_click = function () {
        vm.open_attribute_value_window = true;
        vm.attribure_value_to_edit = "";
        vm.attribute_value_add_mode = true;
    };

    /*vm.matrix_value_cancelled_callback = function () {

     vm.open_attribute_value_window = false;
     };
     */
    /*vm.matrix_value_save_callback = function (attribute_value_id) {
     vm.attribute_value.attribute_values.push(attribute_value_id);
     vm.attribute_value_data_source = product_attribute_value_service.get_record_data_source(util.ad_find_options(true, false),
     product_attribute_value_service.filter_none(), 999999, $scope);
     var attribute_value_select = $("#attribute_value_select").data("kendoMultiSelect");
     if (attribute_value_select) {
     attribute_value_select.setDataSource(vm.attribute_value_data_source);
     }
     vm.open_attribute_value_window = false;
     };*/

    vm.get_branch_records = function (lookup_item) {

        vm.item_branch_list = vm.product.item_details;
        var is_active_branch_available = false;
        if (vm.product && vm.item_branch_list) {
            var deleted_branch_list = vm.item_branch_list.filter(function (item) {
                return item.is_deleted === true;
            });
            vm.item_branch_list_count = (vm.item_branch_list.length - deleted_branch_list.length);
        } else {
            vm.item_branch_list_count = 0;
        }
        if (lookup_item) {
            if (vm.item_branch_list && vm.item_branch_list.length > 0) {
                angular.forEach(vm.item_branch_list, function (branch_item) {
                    if (branch_item.branch && branch_item.branch == vm.active_branch) {
                        is_active_branch_available = true;
                        vm.select_item(branch_item.branch);
                    }
                });
                if (!is_active_branch_available) {
                    //vm.select_item(vm.item_branch_list[0].branch);
                    vm.disable_tabs_section = true;
                    vm.item = {};
                    if (vm.product.product_type === product_kit || vm.product.product_type === product_shipper) {
                        $timeout(function () {
                            $scope.$broadcast("get_new_item_details", {"no_active_branch": true});
                        });
                    }
                }
            }
        }
        if (vm.all_inventory_access_obj.access_price_cost) {
            vm.set_item_prices();
        }

    };

    /*
        Copy all the item prices into existing vm.item before switching to new item.
    */
    vm.copy_item_prices = function () {
        let grid_data = vm.alternate_unit_grid_data_source.data().toJSON();
        let current_selected_item = angular.copy(vm.item);
        let default_item_price = {};
        if (current_selected_item && current_selected_item.prices && current_selected_item.prices.length > 0) {
            for (let i = 0; i < current_selected_item.prices.length; i++) {
                if (current_selected_item.prices[i].is_default) {
                    default_item_price = current_selected_item.prices[i];
                    break;
                }
            }
            vm.item.prices = [];
            vm.item.prices.push(default_item_price);
            for (let j = 0; j < grid_data.length; j++) {
                if (!grid_data[j].is_default) {
                    if (grid_data[j].hasOwnProperty('selling_price_uom')) {
                        grid_data[j].uom = grid_data[j].selling_price_uom;
                    }

                    if (grid_data[j].hasOwnProperty('selling_price_uom_name')) {
                        grid_data[j].uom_name = grid_data[j].selling_price_uom_name;
                    }

                    vm.item.prices.push(grid_data[j]);
                }
            }
        }
    };

    /*
    * sort location codes based on primary location
    */
    const _sort_location_codes = function () {
        let codes = angular.copy(vm.item.stocking.bin_locations);
        codes.sort(function (a, b) {
            return a.is_primary ? -1 : 1;
        });
        vm.item.stocking.bin_locations = codes;
    };

    vm.select_item = function (id) {
        //vm.store_list_popover_options.isOpen = false;
        vm.refresh_calculations_when_store_changes = true;
        vm.selected_branch_id = id;
        close_store_list_panel();

        if (vm.has_serial_number_tab_access && vm.serial_number_grid_loaded_flag) {
            $scope.$broadcast('serial_number_branch_change', id);
        }


        // Item is currently displayed and might have changes.  Save those changes before
        // displaying next item.
        if (vm.is_item_displayed) {
            vm.fill_product_record();
        }
        vm.selected_supplier = {};
        vm.show_add_to_stores = false;
        vm.is_item_displayed = false;
        vm.next_supplier_id = -1;
        vm.current_item_branch = $rootScope.rs_toogo_user.configurations.location_display_label + " Information:  Item not in Store Record.";
        vm.branch_text_not_found = true;
        vm.disable_tabs_section = false;
        if (vm.product && vm.product.item_details && vm.product.item_details.length > 0) {
            angular.forEach(vm.product.item_details, function (item_detail) {
                //if (item_detail.id == id) {
                if (item_detail.branch === id) {
                    if (vm.product.price_by === 0) {
                        vm.copy_item_prices();
                    }
                    vm.item = item_detail;
                    if (vm.item.stocking && vm.item.stocking.bin_locations && vm.item.stocking.bin_locations.length)
                        _sort_location_codes();
                    vm.is_item_displayed = true;
                    if (vm.all_inventory_access_obj.access_price_cost) {
                        vm.set_product_prices();
                        vm.set_item_prices();
                    }
                    vm.set_variant_values();
                    if (vm.all_inventory_access_obj.access_product_history) {
                        vm.set_item_history_data_source();
                    }
                    vm.set_suppliers();
                    if (vm.all_inventory_access_obj.access_price_cost) {
                        vm.set_price_books();
                    }

                    vm.current_item_branch = $rootScope.rs_toogo_user.configurations.location_display_label + " Information:  " + vm.item.branch_name;
                    vm.history_time_type = 'week';
                    vm.branch_text_not_found = false;

                    vm.set_component_tab_branch_info();
                    if (vm.product.product_type === product_kit || vm.product.product_type === product_shipper) {
                        _get_components_details(vm.product.id, vm.item.branch, vm.product.kit_components);
                        $scope.$broadcast("get_new_item_details");
                    }
                }
            });
        }

        if (vm.product.product_type !== product_kit || vm.product.product_type !== product_shipper || vm.product.product_type !== product_fee || vm.product.product_type !== product_membership_fee || vm.product.product_type !== product_donation) {
            if (vm.product.price_by === 0) {
                _reset_alternate_unit_prices();
            }
            _set_alternate_grid_initial_flags();
            _alternate_unit_grid_data_source();
            _initiate_alternative_units_grid();
        }
        $scope.$broadcast('item_changed');
    };

    const _reset_alternate_unit_prices = function () {
        vm.alternate_selling_price = [];
        for (let i = 0; i < vm.item.prices.length; i++) {
            if (!vm.item.prices[i].is_default) {
                if (!vm.item.prices[i].hasOwnProperty('uom_name')) {
                    vm.item.prices[i].uom_name = vm.item.prices[i].uom_code;
                }

                vm.item.prices[i].is_default = false;

                if (!vm.item.prices[i].hasOwnProperty('selling_price_uom_name')) {
                    vm.item.prices[i].selling_price_uom_name = vm.item.prices[i].uom_code;
                }

                if (!vm.item.prices[i].hasOwnProperty('selling_price_uom')) {
                    vm.item.prices[i].selling_price_uom = vm.item.prices[i].uom;
                }

                if (vm.item.prices[i].price_method === 2) {
                    vm.item.prices[i].markup_price = vm.item.prices[i].markup_from_retail_percent;
                } else if (vm.item.prices[i].price_method === 1) {
                    vm.item.prices[i].markup_price = vm.item.prices[i].discount_off_retail_percent;
                }

                vm.alternate_selling_price.push(vm.item.prices[i]);
            }
        }
    };


    vm.set_component_tab_branch_info = function () {
        vm.component_current_item_branch = "Cost, Retails & Quantity on Hand Shown for :  " + vm.item.branch_name;
    };

    vm.format_item_date = function (the_date) {
        var new_date = "";
        if (the_date) {
            new_date = moment(the_date).format('MM-DD-YYYY');
        }
        return (new_date);
    };

    vm.calculate_gross_profit = function (price, price_uom, price_sell_multiple) {
        var gp = 0.00;
        var sell_price = 0.00;
        var cost = 0.00;
        if (vm.item && vm.item.costs && vm.item.costs.length > 0) {
            cost = vm.item.costs[0].replacement_cost;
            if (vm.item.costs.replacement_cost) {
                cost = vm.item.costs.replacement_cost;
            }
        }
        if (price_sell_multiple == null) {
            price_sell_multiple = 1;
        }
        if (price && price_uom && price_sell_multiple && cost) {
            // replacement cost is in stocking UOM
            // price is in selling_uom with selling multiple to default selling uom

            // Make sure we have valid default stocking and selling UOMs.
            if (vm.product_stocking_uom != null && vm.product_selling_uom != null && vm.product_selling_uom_multiple != null) {
                if (price_uom != vm.product_selling_uom) {
                    // Alternate price - Convert price to stocking UOM to match cost UOM
                    if (price != 0.00 & price_sell_multiple != 0) {
                        sell_price = price / price_sell_multiple;
                    }
                } else {
                    sell_price = price;
                    // Check if we need to convert selling uom to stocking uom
                    if (vm.product_selling_uom != vm.product_stocking_uom && sell_price != 0.00) {
                        sell_price = sell_price / vm.product_selling_uom_multiple;
                    }
                }

            }
            if (sell_price != 0.00) {
                gp = ((sell_price - cost) / sell_price) * 100;
            }

        }
        if (isNaN(gp)) {
            return gp;
        }
        //return ep_percentageFilter(gp);// (gp * 1.0).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + '%';
        return (gp * 1.0).toFixed(2);
    };

    vm.set_suppliers = function () {
        vm.product_suppliers = vm.item.buying.suppliers;
        $scope.$broadcast('set_suppliers');

    };

    vm.set_upc = function () {
        var upc_record = [];
        vm.edit_product_upcs = [];
        vm.upc_added = false;

        if (vm.product.product_variants) {
            for (var x = 0; x < vm.product.product_variants.length; x++) {
                for (var y = 0; y < vm.product.product_variants[x].alternate_codes.length; y++) {
                    upc_record = vm.product.product_variants[x].alternate_codes[y];
                    if (upc_record) {
                        vm.edit_product_upcs.push({
                            'alternate_code': upc_record.alternate_code,
                            'uom': upc_record.uom,
                            'uom_name': upc_record.uom_name,
                            'is_primary': upc_record.is_primary,
                            'id': upc_record.id,
                            'attribute_value_1': vm.product.product_variants[x].product_attribute_value_1,
                            'attribute_value_2': vm.product.product_variants[x].product_attribute_value_2,
                            'attribute_value_3': vm.product.product_variants[x].product_attribute_value_3
                        });
                    }
                }
            }
        }
    };

    vm.set_price_books = function () {

        var pb_tags = [];
        var pb_suppliers = [];
        var pb_item_prices = [];
        var pb_replacement_cost = 0.00;
        var pb_average_cost = 0.00;
        if (vm.product.id && vm.item.branch) {

            pb_tags = [];

            angular.forEach(vm.item.item_tags, function (item_tags) {
                pb_tags.push(item_tags.id)
            });

            angular.forEach(vm.product.product_tags, function (product_tags) {
                pb_tags.push(product_tags.id)
            });

            angular.forEach(vm.product_suppliers, function (supplier) {
                pb_suppliers.push(supplier.supplier)
            });

            pb_item_prices.push(vm.selling_price);
            angular.forEach(vm.alternate_selling_price, function (alt_price) {
                pb_item_prices.push(alt_price);
            });

            if (vm.item.costs && vm.item.costs.replacement_cost) {
                pb_replacement_cost = vm.item.costs.replacement_cost;
            }

            if (vm.item.costs && vm.item.costs.average_cost) {
                pb_average_cost = vm.item.costs.average_cost;
            }

            vm.price_book_filter_parameters = {
                branch_id: vm.item.branch,
                supplier_ids: pb_suppliers,
                category: vm.product.category,
                tags: pb_tags,
                item_prices: pb_item_prices,
                replacement_cost: pb_replacement_cost,
                average_cost: pb_average_cost
            };

            product_product_service.get_price_book(vm.product.id, vm.price_book_filter_parameters).then(function (response) {
                vm.item.price_books = response.price_book;
                vm.product_price_book = vm.item.price_books;
                vm.product_price_book_data_source.data(vm.product_price_book);
            }, function (error) {
                util.handleErrorWithWindow(error);
                vm.item.price_books = [];
            });
        }

    };

    vm.launch_price_book = function (price_book_id) {
        if (vm.all_inventory_access_obj.access_price_books) {
            vm.price_book_dialog.close();
            $window.location.href = '#/products/price_books/edit/' + price_book_id;
        }
    };


    vm.set_variant_values = function () {
        var x = 0;
        var y = 0;
        var new_max_quantity = 0;
        var new_average_cost = 0;
        var new_last_cost = 0;
        var new_qoh = 0;
        var new_qoo = 0;
        var new_qav = 0;
        var new_replacement_cost = 0;
        var new_selling_price = null;
        vm.buying_variant_value_disabled = true;
        vm.pricing_variant_value_disabled = true;
        if (vm.product.product_type == 1 || vm.product.product_type == '1') {
            //vm.edit_buying_variant_detail = JSON.parse(JSON.stringify(vm.item.stocking.onhand_details));
            // Fill the variant arrays for buying screen and pricing screen using the values read from server.
            create_empty_edit_buying_variant_values_structure();
            create_empty_edit_pricing_variant_values_structure();
            if (vm.buying_variant_field < 10) {
                vm.buying_variant_value_disabled = false;

            }
            if (vm.pricing_variant_field < 10) {
                vm.pricing_variant_value_disabled = false;
            }
            if (vm.item && vm.item.buying.order_points && vm.item.buying.order_points.length > 0) {
                for (x = 0; vm.item.buying.order_points.length > x; x++) {
                    new_max_quantity = null;
                    if (vm.item.buying.max_quantities && vm.item.buying.max_quantities.length > 0) {
                        if (vm.item.buying.max_quantities[x]) {
                            new_max_quantity = vm.item.buying.max_quantities[x].max_quantity;
                        }
                    }
                    new_average_cost = null;
                    if (vm.item.stocking.average_costs && vm.item.stocking.average_costs.length > 0) {
                        if (vm.item.stocking.average_costs[x]) {
                            new_average_cost = vm.item.stocking.average_costs[x].average_cost;
                        }
                    }
                    new_last_cost = null;
                    if (vm.item.stocking.last_costs && vm.item.stocking.last_costs.length > 0) {
                        if (vm.item.stocking.last_costs[x] && vm.item.stocking.last_costs[x].last_received_cost) {
                            new_last_cost = vm.item.stocking.last_costs[x].last_received_cost;
                        }
                    }
                    new_qoh = null;
                    if (vm.item.stocking.on_hand_quantities && vm.item.stocking.on_hand_quantities.length > 0) {
                        if (vm.item.stocking.on_hand_quantities[x]) {
                            new_qoh = vm.item.stocking.on_hand_quantities[x].qty_on_hand;
                        }
                    }
                    new_qoo = null;
                    if (vm.item.stocking.on_order_quantities && vm.item.stocking.on_order_quantities.length > 0) {
                        if (vm.item.stocking.on_order_quantities[x]) {
                            new_qoo = vm.item.stocking.on_order_quantities[x].qty_on_order;
                        }
                    }
                    new_qav = null;
                    if (vm.item.stocking.available_quantities && vm.item.stocking.available_quantities.length > 0) {
                        if (vm.item.stocking.available_quantities[x]) {
                            new_qav = vm.item.stocking.available_quantities[x].qty_available;
                        }
                    }
                    new_replacement_cost = null;
                    if (vm.item.costs.replacement_costs && vm.item.costs.replacement_costs.length > 0) {
                        if (vm.item.costs.replacement_costs[x] && vm.item.costs.replacement_costs[x].cost) {
                            new_replacement_cost = vm.item.costs.replacement_costs[x].cost;
                        }
                    }

                    if (vm.item.buying.order_points[x].variant_value_1 != null || vm.item.buying.order_points[x].variant_value_2 != null ||
                        vm.item.buying.order_points[x].variant_value_3 != null) {
                        //var found = false;

                        for (var z = 0; vm.edit_buying_variant_detail.length > z; z++) {
                            if (vm.edit_buying_variant_detail[z].variant_value_1 == vm.item.buying.order_points[x].variant_value_1 &&
                                vm.edit_buying_variant_detail[z].variant_value_2 == vm.item.buying.order_points[x].variant_value_2 &&
                                vm.edit_buying_variant_detail[z].variant_value_3 == vm.item.buying.order_points[x].variant_value_3) {
                                vm.edit_buying_variant_detail[z].order_point = vm.item.buying.order_points[x].order_point;
                                vm.edit_buying_variant_detail[z].max_quantity = new_max_quantity;
                                vm.edit_buying_variant_detail[z].qoh = new_qoh;
                                vm.edit_buying_variant_detail[z].qoo = new_qoo;
                                vm.edit_buying_variant_detail[z].qav = new_qav;
                                //found = true;
                            }
                        }

                        //found = false;
                        for (z = 0; vm.edit_pricing_variant_detail.length > z; z++) {
                            if (vm.edit_pricing_variant_detail[z].variant_value_1 == vm.item.buying.order_points[x].variant_value_1 &&
                                vm.edit_pricing_variant_detail[z].variant_value_2 == vm.item.buying.order_points[x].variant_value_2 &&
                                vm.edit_pricing_variant_detail[z].variant_value_3 == vm.item.buying.order_points[x].variant_value_3) {
                                vm.edit_pricing_variant_detail[z].average_cost = new_average_cost;
                                vm.edit_pricing_variant_detail[z].last_received_cost = new_last_cost;
                                vm.edit_pricing_variant_detail[z].replacement_cost = new_replacement_cost;
                                vm.edit_pricing_variant_detail[z].selling_price = new_selling_price;
                                //found = true;
                            }
                        }

                    }

                }
            }

            for (x = 0; vm.item.prices.length > x; x++) {
                if (vm.item.prices[x].is_default) {
                    for (y = 0; vm.edit_pricing_variant_detail.length > y; y++) {
                        if (vm.edit_pricing_variant_detail[y].variant_value_1 == vm.item.prices[x].variant_value_1 &&
                            vm.edit_pricing_variant_detail[y].variant_value_2 == vm.item.prices[x].variant_value_2 &&
                            vm.edit_pricing_variant_detail[y].variant_value_3 == vm.item.prices[x].variant_value_3) {
                            vm.edit_pricing_variant_detail[y].selling_price = vm.item.prices[x].price;
                        }
                    }
                }
            }
            vm.set_item_variant_grid_options();
        } else {
            // Fill the screen values for fields kept at variant levels.
            if (vm.item.stocking.average_costs && vm.item.stocking.average_costs.length > 0) {
                vm.item.stocking.average_cost = vm.item.stocking.average_costs[0].average_cost;
            }
            if (vm.item.stocking.last_costs && vm.item.stocking.last_costs.length > 0) {
                vm.item.stocking.last_cost = vm.item.stocking.last_costs[0].last_cost;
            }
            if (vm.item.stocking.on_hand_quantities && vm.item.stocking.on_hand_quantities.length > 0) {
                vm.item.stocking.qty_on_hand = vm.item.stocking.on_hand_quantities[0].qty_on_hand;
            }
            if (vm.item.stocking.available_quantities && vm.item.stocking.available_quantities.length > 0) {
                vm.item.stocking.qty_available = vm.item.stocking.available_quantities[0].qty_available;
            }
            if (vm.item.buying.order_points && vm.item.buying.order_points.length > 0) {
                vm.item.buying.order_point = vm.item.buying.order_points[0].order_point;
            }
            if (vm.item.buying.max_quantities && vm.item.buying.max_quantities.length > 0) {
                vm.item.buying.max_quantity = vm.item.buying.max_quantities[0].max_quantity;
            }
        }
    };

    vm.item_tag_added = function (tag) {
        tag.branch = vm.item_branch;
        if (!tag.id) {
            vm.validating_tag = true;
            product_tags_lookup_service.get_records(util.ad_find_options(true, false),
                product_tags_lookup_service.filter_tags(tag.name)).then(function (product_tags) {
                angular.forEach(product_tags, function (product_tag) {
                    if (product_tag.name.toUpperCase() == tag.name.toUpperCase()) {
                        tag.id = product_tag.id;
                        tag.name = product_tag.name;
                    }
                });
                vm.validating_tag = false;
            }, function error(reason) {
                vm.validating_tag = false;
            });
        }
    };

    vm.product_tag_added = function (tag) {
        // validate that the tag they entered does not already exist.  If it does then give this tag that ID (ignore case)
        if (!tag.id) {
            vm.validating_tag = true;
            product_tags_lookup_service.get_records(util.ad_find_options(true, false),
                product_tags_lookup_service.filter_tags(tag.name)).then(function (product_tags) {
                angular.forEach(product_tags, function (product_tag) {
                    if (product_tag.name.toUpperCase() == tag.name.toUpperCase()) {
                        tag.id = product_tag.id;
                        tag.name = product_tag.name;
                    }
                });
                vm.validating_tag = false;
            }, function error(reason) {
                vm.validating_tag = false;
            });
        }
    };

    vm.item_bin_added = function (tag) {
    };

    vm.edit_product_uom_clicked = function () {

        if (vm.product.id) {


            vm.dialog_window_size = 'md';

            var buttons = [
                {
                    text: "CANCEL",
                    primary: false,
                    callback: close_uom_dialog/*function () {
                        if (vm.product_uom_dialog) {
                            vm.product_uom_dialog.close();
                        }
                    }*/
                },
                {
                    text: "OK",
                    primary: true,
                    callback: vm.product_uom_done_response
                }

            ];
            vm.product_uom_dialog = StdDialog.custom({
                size: vm.dialog_window_size,
                title: "Units of Measure",
                templateUrl: 'app/product/product_maintenance/views/templates/product_uom_edit.html',
                windowClass: 'ep-alert-override-modal',
                auto_close: false,
                controller_name: "product_controller",
                scope: $scope,
                icon: "mdi mdi-scale-balance",
                buttons: buttons,
                is_keyboard_support_required: true,
                rendered_callback: 'uom_dialog_rendered',
                back_action: close_uom_dialog
            });
        }
    };

    vm.uom_dialog_rendered = function () {
        vm.focus_stocking_uom = true;
    }

    const close_uom_dialog = function () {
        if (vm.product_uom_dialog)
            vm.product_stocking_uom = vm.product_stocking_uom_old_value;
        vm.product.stocking_uom_name = vm.product_stocking_uom_name_old_value;

        vm.product_selling_uom = vm.product_selling_uom_old_value;
        vm.product.default_selling_uom_name = vm.product_selling_uom_name_old_value;

        vm.product_purchasing_uom = vm.product_purchasing_uom_old_value;
        vm.product.default_purchasing_uom_name = vm.product_purchasing_uom_name_old_value;

        vm.product_selling_uom_multiple = vm.product_selling_uom_multiple_old_value;
        vm.uom_order_multiple = vm.uom_order_multiple_old_value;
        vm.product_uom_dialog.close();
    };

    vm.product_uom_done_response = function () {
        var valid_product_uom = true;
        valid_product_uom = vm.check_product_uom_validity();
        if (valid_product_uom) {
            vm.product_uom_dialog.remove_inline_error_message();

            //if (vm.product.stocking_uom == vm.product_purchasing_uom) {
            //    vm.product.default_purchasing_stocking_multiple = vm.product_order_quantity_multiple;
            //    vm.product.default_purchasing_multiple = vm.product_order_quantity_multiple;
            // Always put the order_quantity_multiple or the purchasing_uom_multiple into the default value.
            // Since there is only one field in product for this.  We will split it out on the supplier side.
            //} else{
            if (vm.product.product_type !== product_membership_fee && vm.product.product_type !== product_kit) {
                vm.uom_order_multiple = angular.isUndefined(vm.uom_order_multiple) ? 1 : vm.uom_order_multiple;
                vm.product.default_purchasing_multiple = vm.uom_order_multiple;
                if (vm.product.stocking_uom == vm.product_purchasing_uom) {
                    vm.product_purchasing_uom_multiple = 1;
                    vm.product_order_quantity_multiple = vm.uom_order_multiple;
                } else {
                    vm.product_purchasing_uom_multiple = vm.uom_order_multiple;
                    vm.product_order_quantity_multiple = 1.00;
                }
            }
            vm.product.default_selling_multiple = vm.product_selling_uom_multiple;
            if (vm.product_uom_dialog) {
                vm.product_stocking_uom_old_value = vm.product_stocking_uom;
                vm.product_stocking_uom_name_old_value = vm.product.stocking_uom_name;
                vm.product_selling_uom_old_value = vm.product_selling_uom;
                vm.product_selling_uom_name_old_value = vm.product.default_selling_uom_name;
                vm.product_purchasing_uom_old_value = vm.product_purchasing_uom;
                vm.product_purchasing_uom_name_old_value = vm.product.default_purchasing_uom_name;
                vm.product_selling_uom_multiple_old_value = vm.product_selling_uom_multiple;
                vm.uom_order_multiple_old_value = vm.uom_order_multiple;
                vm.product_uom_dialog.close();
            }
        }
    };

    vm.edit_product_specification_clicked = function () {

        if (vm.product.id) {

            vm.dialog_window_size = 'md';

            var buttons = [
                {
                    text: "Cancel",
                    primary: false,
                    callback: close_specifications_dialog

                },
                {
                    text: "OK",
                    primary: true,
                    callback: vm.product_specification_save_response
                }

            ];
            vm.product_specification_dialog = StdDialog.custom({
                size: vm.dialog_window_size,
                title: "Specifications",
                templateUrl: 'app/product/product_maintenance/views/templates/product_specification_edit.html',
                windowClass: 'ep-alert-override-modal',
                auto_close: false,
                controller_name: "product_controller",
                scope: $scope,
                icon: "mdi mdi-file-document-box",
                buttons: buttons,
                is_keyboard_support_required: true,
                rendered_callback: 'specifications_dialog_rendered',
                back_action: close_specifications_dialog
            });

        }
    };

    vm.specifications_dialog_rendered = function () {
        vm.focus_height = true;
    }

    const close_specifications_dialog = function () {
        if (vm.product_specification_dialog) {
            vm.product.height = vm.height_old_value;
            vm.product.height_unit = vm.height_unit_old_value;
            vm.product.height_unit_description = vm.height_unit_description_old_value;
            vm.product.cube = vm.cube_old_value;
            vm.product.cubic_unit = vm.cubic_unit_old_value;
            vm.product.cubic_unit_description = vm.cubic_unit_description_old_value;
            vm.product.length = vm.length_old_value;
            vm.product.length_unit = vm.length_unit_old_value;
            vm.product.length_unit_description = vm.length_unit_description_old_value;
            vm.product.weight = vm.weight_old_value;
            vm.product.weight_unit = vm.weight_unit_old_value;
            vm.product.weight_unit_description = vm.weight_unit_description_old_value;
            vm.product.width = vm.width_old_value;
            vm.product.width_unit = vm.width_unit_old_value;
            vm.product.width_unit_description = vm.width_unit_description_old_value;
            vm.product_specification_dialog.close();
        }
    }

    vm.product_specification_save_response = function () {
        var valid_product_specification = true;
        valid_product_specification = vm.check_product_specifications_validity();
        if (valid_product_specification) {
            vm.format_specification_message();
            if (vm.product_specification_dialog) {
                vm.height_old_value = vm.product.height;
                vm.height_unit_old_value = vm.product.height_unit;
                vm.height_unit_description_old_value = vm.product.height_unit_description;
                vm.cube_old_value = vm.product.cube;
                vm.cubic_unit_old_value = vm.product.cubic_unit;
                vm.cubic_unit_description_old_value = vm.product.cubic_unit_description;
                vm.length_old_value = vm.product.length;
                vm.length_unit_old_value = vm.product.length_unit;
                vm.length_unit_description_old_value = vm.product.length_unit_description;
                vm.weight_old_value = vm.product.weight;
                vm.weight_unit_old_value = vm.product.weight_unit;
                vm.weight_unit_description_old_value = vm.product.weight_unit_description;
                vm.width_old_value = vm.product.width;
                vm.width_unit_old_value = vm.product.width_unit;
                vm.width_unit_description_old_value = vm.product.width_unit_description;
                vm.product_specification_dialog.close();
            }

        }
    };

    vm.product_specification_cancel_response = function () {
        if (vm.product_specification_dialog) {
            vm.product_specification_dialog.close();
        }
    };

    const close_consumer_brand_detail_dialog = function () {
        if (vm.product_brand_dialog) {
            vm.product_brand_dialog.close();
        }
    };

    vm.edit_product_brand_clicked = function () {
        if (vm.product.id) {

            vm.dialog_window_size = 'md';
            vm.consumer_brand_name = vm.product.consumer_brand_name;
            vm.brand_comparison_uom = vm.product.brand_comparison_uom;
            vm.brand_comparison_uom_code = vm.product.brand_comparison_uom_code;
            vm.brand_comparison_conversion_factor = vm.product.brand_comparison_conversion_factor;

            var buttons = [
                {
                    text: "Cancel",
                    primary: false,
                    callback: close_consumer_brand_detail_dialog
                },
                {
                    text: "Clear",
                    primary: false,
                    callback: vm.product_brand_clear_response
                },
                {
                    text: "Ok",
                    primary: true,
                    callback: vm.product_brand_done_response
                }

            ];
            vm.product_brand_dialog = StdDialog.custom({
                size: vm.dialog_window_size,
                title: "Consumer Brand Detail",
                templateUrl: 'app/product/product_maintenance/views/templates/product_brand_edit.html',
                windowClass: 'ep-alert-override-modal',
                auto_close: false,
                controller_name: "product_controller",
                scope: $scope,
                icon: "mdi mdi-seal",
                buttons: buttons,
                is_keyboard_support_required: true,
                rendered_callback: 'consumer_detail_dialog_rendered',
                back_action: close_consumer_brand_detail_dialog
            });
        }

    };

    vm.consumer_detail_dialog_rendered = function () {
        vm.focus_brand_name = true;
    };


    vm.product_brand_clear_response = function () {
        vm.consumer_brand_name = "";
        vm.brand_comparison_uom = null;
        vm.brand_comparison_uom_code = "";
        vm.brand_comparison_conversion_factor = 1;
    };

    vm.product_brand_done_response = function () {
        var valid_product_brand = true;
        valid_product_brand = vm.check_product_brand_validity();
        if (valid_product_brand) {
            vm.product.consumer_brand_name = vm.consumer_brand_name;
            vm.product.brand_comparison_uom = vm.brand_comparison_uom;
            vm.product.brand_comparison_uom_code = vm.brand_comparison_uom_code;
            vm.product.brand_comparison_conversion_factor = vm.brand_comparison_conversion_factor;
            if (vm.product_brand_dialog) {
                vm.product_brand_dialog.close();
            }
        }
    };
    vm.product_specification_height_selected = function (event) {
        console.log(event);
        vm.product.height_unit_description = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };

    vm.product_specification_width_selected = function (event) {
        vm.product.width_unit_description = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };

    vm.product_specification_uom_length_selected = function (event) {
        vm.product.length_unit_description = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };

    vm.product_specification_cube_selected = function (event) {
        vm.product.cubic_unit_description = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };

    vm.product_specification_weight_selected = function (event) {
        vm.product.weight_unit_description = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };

    vm.product_uom_uom_selected = function (event, index) {
        vm.product.product_uoms[index].uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };

    vm.product_brand_uom_selected = function (event) {
        vm.brand_comparison_uom_code = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };

    vm.product_type_selected = function (event) {
        vm.product.product_type = event.sender.dataItem(event.item).id;
        if (vm.edit_product_attributes && vm.edit_product_attributes.length > 0 && vm.product.product_type != 1) {
            vm.edit_product_attributes = [];
            vm.set_item_variant_grid_options();
        }
        if (vm.product.product_type == 4) {
            vm.firearm_type = "";
        }
    };
    const show_inline_error_kit_shipper = function () {
        var val = (vm.new_item.product_type === product_kit) ? 'Kit' : 'Shipper';
        var inline_error_msg = 'This item is a ' + val + ' and cannot be set to prompt for price.';
        vm.item_quick_add_dialog.remove_inline_error_message();
        vm.item_quick_add_dialog.inline_error_message(inline_error_msg);
    };

    vm.new_item_price_by_selected = function (event) {
        var price_by = event.dataItem.id;
        if (price_by === prompt_price_tye) {
            if (vm.new_item.product_type === product_kit || vm.new_item.product_type === product_shipper) {
                event.preventDefault();
                show_inline_error_kit_shipper();

            }
        } else {
            vm.add_or_remove_mandatory_class();
        }

    };

    vm.new_item_product_type_selected = function (event) {
        if (vm.item_quick_add_dialog) {
            vm.item_quick_add_dialog.remove_inline_error_message();
            vm.new_item.price_by = 2;
            if (vm.new_item.product_type === product_kit) {
                vm.new_item.kit_price_option = 3;
                vm.new_item.kit_markup_from_cost_percent = null;
                vm.new_item.kit_discount_off_retail_percent = null;
                vm.new_item.set_price = null;
            }
            if (vm.new_item.product_type === product_membership_fee) {
                vm.new_item.price_by = 2;
            }
            if (vm.new_item.product_type === product_donation) {
                vm.new_item.price_by = 3;
            }
            if (vm.new_item.product_type === product_gift_card) {
                vm.new_item.price_by = 2;
                vm.disable_price_by = false;
                vm.new_item.gift_card_type = 10;
                if (vm.new_item.stores.length === 0)
                    vm.new_item.stores = [-1];

                if (vm.gift_card_type_data_source.data().length === 0)
                    vm.item_quick_add_dialog.inline_error_message("No active gift card types are available. Please check Settings");
            }
            if (vm.new_item.product_type !== product_gift_card) { // Need to clear the sub type variables to show all the fields in add item model.
                vm.new_item.gift_card_type = undefined;
            }
        }
    };

    vm.new_item_gift_card_type_changed = function () {

        if (vm.new_item.stores.length === 0)
            vm.new_item.stores = [-1];

        if (vm.new_item.gift_card_type === 40) {
            vm.new_item.stores = [-1];
            vm.disable_price_by = true;
            vm.new_item.price_by = 3;
            return false;
        }
        if (vm.new_item.gift_card_type === 20) {
            vm.disable_price_by = true;
            vm.new_item.price_by = 3;
            return false;
        }
        vm.disable_price_by = false;
        vm.new_item.price_by = 2;
    };

    vm.pricing_change_quick_add = function () {
        vm.item_quick_add_dialog.remove_inline_error_message();
        vm.new_item.kit_discount_off_retail_percent = null;
        vm.new_item.kit_markup_from_cost_percent = null;
        vm.new_item.set_price = null;
    };

    vm.new_item_supplier_selected = function (event) {
        var sup_rec = event.sender.dataItem(event.item);
        vm.new_item.is_active = sup_rec.is_active;
    };


    vm.get_attribute_values_options = function (attribute) {
        if (!attribute) {
            attribute = "999999999999";
        }

        var attribute_value_data_source = product_attribute_value_service.get_record_server_filter_data_source_no_group(util.ad_find_options(true, false),
            product_attribute_value_service.filter_product_attribute(attribute), 999999, $scope);

        return {
            placeholder: "Select Attribute Values...",
            dataTextField: "name",
            dataValueField: "id",
            valuePrimitive: true,
            autoBind: false,
            dataSource: attribute_value_data_source,
            change: function (e) {
                var previous = this._savedOld;
                var current = this.value();

                saveCurrent(this);
                var diff = $(previous).not(current).get();

                var removedSkill = diff;
                diff = $(current).not(previous).get();
                var addedSkill = diff;
                if (addedSkill.length > 1 || removedSkill.length > 1) {
                    if (addedSkill.length > 1) {
                        addedSkill = addedSkill[addedSkill.length - 1];
                        addVariantValue(this, addedSkill);
                    }
                    if (removedSkill.length > 1) {
                        removedSkill = removedSkill[removedSkill.length - 1];
                        removeVariantValue(removedSkill);
                    }
                } else {
                    if (addedSkill.length > 0) {
                        addVariantValue(this, addedSkill);
                    }
                    if (removedSkill.length > 0) {
                        removeVariantValue(removedSkill);
                    }
                }
            },
            dataBound: function (e) {
                saveCurrent(this);
            }
        };
    };

    function saveCurrent(multi) {
        multi._savedOld = multi.value().slice(0);
    }

    function addVariantValue(e, addedSkill) {
        // We are keeping a working copy of the variant values for a variant so the multiselect doesn't
        // remove the variant text values.  Update it with the new variant value added.
        var current_text = e.dataItems();
        var variant_attribute = 0;
        var variant_name = '';
        var variant_id = 0;
        var x = 0;
        if (current_text.length > 0) {
            for (x = 0; current_text.length > x; x++) {
                if (current_text[x].id == addedSkill[0]) {
                    variant_attribute = current_text[0].product_attribute;
                    variant_name = current_text[x].name;
                    variant_id = current_text[x].id;
                }
            }

        }
        for (x = 0; vm.edit_product_attributes.length > x; x++) {
            if (vm.edit_product_attributes[x].attribute == variant_attribute) {
                if (vm.edit_product_attributes[x].attribute_working_values) {
                    if (vm.edit_product_attributes[x].attribute_values.length > vm.edit_product_attributes[x].attribute_working_values.length) {
                        vm.edit_product_attributes[x].attribute_working_values.push({
                            name: variant_name,
                            id: variant_id
                        });
                    }
                } else {
                    vm.edit_product_attributes[x].attribute_working_values = [];
                    vm.edit_product_attributes[x].attribute_working_values.push({
                        name: variant_name,
                        id: variant_id
                    });
                }
            }
        }
        vm.set_attribute_value_data_sources();
        add_variant_value_to_structure(variant_attribute, variant_id);
        vm.set_item_variant_grid_options();
    }

    function removeVariantValue(removedSkill) {
        // We are keeping a working copy of the variant values for a variant so the multiselect doesn't
        // remove the variant text values.  Remove the variant value.
        //var current_text = e.dataItems();
        var new_attribute_values = [];
        var removed_attribute = null;
        var removed_id = removedSkill[0];
        if (vm.edit_product_attributes.length > 0) {
            for (var x = 0; vm.edit_product_attributes.length > x; x++) {
                if (vm.edit_product_attributes[x].attribute_working_values) {
                    new_attribute_values = [];
                    for (var y = 0; vm.edit_product_attributes[x].attribute_working_values.length > y; y++) {
                        if (vm.edit_product_attributes[x].attribute_working_values[y].id != removedSkill[0]) {
                            new_attribute_values.push({
                                id: vm.edit_product_attributes[x].attribute_working_values[y].id,
                                name: vm.edit_product_attributes[x].attribute_working_values[y].name
                            });
                        } else {
                            removed_attribute = vm.edit_product_attributes[x].attribute;
                        }
                    }
                }
                vm.edit_product_attributes[x].attribute_working_values = new_attribute_values;
            }
        }

        vm.set_attribute_value_data_sources();
        remove_variant_value_from_structure(removed_attribute, removed_id);
        vm.set_item_variant_grid_options();
    }

    vm.product_attribute_selected = function (event, change_index) {
        var attribute = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
        var attribute_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        if (!vm.edit_product_attributes) {
            vm.edit_product_attributes = [];
        }
        if (vm.edit_product_attributes.length > change_index) {
            vm.edit_product_attributes[change_index].attribute_name = attribute_name;
            vm.edit_product_attributes[change_index].attribute = attribute;
            vm.edit_product_attributes[change_index].attribute_values = [];
            vm.edit_product_attributes[change_index].attribute_working_values = [];

            if (change_index == 0) {
                vm.product_variant_1_attribute = attribute;
                vm.product_attribute_1_name = attribute_name;
            }
            if (change_index == 1) {
                vm.product_variant_2_attribute = attribute;
                vm.product_attribute_2_name = attribute_name;
            }
            if (change_index == 2) {
                vm.product_variant_3_attribute = attribute;
                vm.product_attribute_3_name = attribute_name;
            }

        } else {
            vm.edit_product_attributes.push({
                attribute_name: attribute_name,
                attribute: attribute,
                attribute_values: [],
                attribute_working_values: []
            });
            if (vm.edit_product_attributes.length == 1) {
                vm.product_variant_1_attribute = attribute;
                vm.product_attribute_1_name = attribute_name;
            }
            if (vm.edit_product_attributes.length == 2) {
                vm.product_variant_2_attribute = attribute;
                vm.product_attribute_2_name = attribute_name;
            }
            if (vm.edit_product_attributes.length == 3) {
                vm.product_variant_3_attribute = attribute;
                vm.product_attribute_3_name = attribute_name;
            }
        }
        var new_options = vm.get_attribute_values_options(attribute);
        var attribute_value_widget = $("#attribute_values" + change_index).data("kendoMultiSelect");
        if (attribute_value_widget) {
            attribute_value_widget.setDataSource(new_options.dataSource);
            attribute_value_widget.value([]);
        }
        vm.set_item_variant_grid_options();
    };

    vm.selling_price_type_selected = function (event) {
        vm.selling_price.price_type = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
    };

    vm.selling_price_uom_selected = function (event) {
        var selling_price_uom = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
        vm.selling_price.selling_price_uom = selling_price_uom;
    };

    vm.alternate_selling_price_type_selected = function (event, change_index) {
        //var price_type = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
        vm.alternate_selling_price[change_index].price_type_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };

    vm.alternate_selling_uom_selected = function (event, change_index) {
        var selected_uom = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
        var selected_uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        var the_rec = vm.alternate_selling_price[change_index];

        vm.alternate_selling_price[change_index].selling_price_uom_name = selected_uom_name;
        if (vm.product.price_by == 2) {
            vm.alternate_selling_price[change_index].product_gross_profit = vm.calculate_gross_profit(the_rec.selling_product_amount, the_rec.selling_price_uom, the_rec.selling_multiple);
        } else {
            vm.alternate_selling_price[change_index].item_gross_profit = vm.calculate_gross_profit(the_rec.selling_item_amount, the_rec.selling_price_uom, the_rec.selling_multiple);
        }

    };

    vm.product_alternate_selling_add = function () {

        if ((vm.product.price_by == 2) || (vm.product.price_by != 2 && vm.is_item_displayed)) {
            if (vm.alternate_selling_price == null) {
                vm.alternate_selling_price = [];
            }

            vm.alternate_selling_price.push({
                price_type: null,
                selling_price_uom: null,
                selling_product_amount: 0.00,
                selling_item_amount: 0.00,
                item_gross_profit: 0.00,
                product_gross_profit: 0.00,
                selling_multiple: 0.00,
                id: null,
                product_price: null,
                is_active: true,
                newly_added: true
            });
        }

    };

    vm.product_alternate_selling_delete = function (the_index) {
        // Save off the deleted record so I can handle updating the other stores' prices.
        if (vm.alternate_deleted_price == null) {
            vm.alternate_deleted_price = [];
        }

        vm.alternate_deleted_price.push({
            price_type: vm.alternate_selling_price[the_index].price_type,
            selling_price_uom: vm.alternate_selling_price[the_index].selling_price_uom,
            selling_amount: vm.alternate_selling_price[the_index].selling_amount,
            selling_multiple: vm.alternate_selling_price[the_index].selling_multiple,
            is_active: vm.alternate_selling_price[the_index].is_active,
            newly_added: vm.alternate_selling_price[the_index].newly_added,
            product_price: vm.alternate_selling_price[the_index].product_price,
            id: vm.alternate_selling_price[the_index].id
        });
        vm.alternate_selling_price.splice(the_index, 1);
    };

    vm.add_to_all_stores_clicked = function () {
        var all_branches = [];
        const _add_new_branch_details = [];
        var x = 0;
        var add_to_store = true;
        var add_to_store_count = 0;
        var saved_item = {};
        var new_item = {};
        var is_add_multiple_stores = true;
        close_store_list_panel();
        organization_branch_service.get_records(util.ad_find_options(true, false), organization_branch_service.filter_none(), 99999, $scope).then(function (branches) {
            all_branches = branches;
            _populate_item_details(all_branches, is_add_multiple_stores);
        });

        //Commenting the below code due to the implementation was different for adding a single store vs multiple stores.
        // Code Will remain commented until we test the code perfectly.Made the multi add code implementation same way as "single add"


        // if (!vm.add_mode) {
        //     organization_branch_service.get_records(util.ad_find_options(true, false), organization_branch_service.filter_none(), 99999, $scope).then(function (branches) {
        //         all_branches = branches;
        //         if (vm.is_item_displayed) {
        //             saved_item = JSON.parse(JSON.stringify(vm.item));
        //             vm.item = {};
        //             vm.item.product = vm.product.id;
        //             vm.item.selling = saved_item.selling;
        //             vm.item.buying = {};
        //             vm.item.buying.suppliers = [];
        //             vm.item.buying = JSON.parse(JSON.stringify(saved_item.buying));
        //             if (vm.product.product_type == product_shipper) {
        //                 angular.forEach(vm.item.buying.suppliers, function (supplier) {
        //                     supplier.id = null;
        //                     supplier.variant = null;
        //                 });
        //             }
        //             else {
        //                 vm.item.buying.suppliers = [];
        //             }
        //             vm.item.stocking = saved_item.stocking;
        //             vm.item.prices = saved_item.prices;
        //             vm.item.costs = saved_item.costs;
        //             vm.item.selling.label_count_type = 1;
        //             vm.item.selling.is_loyalty_active = false;
        //             vm.item.buying.popularity = vm.product.popularity;
        //             vm.item.stocking.track_inventory = true;
        //             vm.item.stocking.is_stocked = true;
        //             vm.item.selling.is_discountable = true;
        //             vm.item.selling.is_taxable = true;
        //             vm.item.stocking.onhand_details = [];
        //             vm.item.is_returnable = true;
        //         } else {
        //             vm.item = {};
        //             vm.item.product = vm.product.id;
        //
        //         }
        //
        //         angular.forEach(all_branches, function (branch) {
        //             //check if it already exists in this store/branch
        //             add_to_store = true;
        //             for (x = 0; x < vm.item_branch_list.length; x++) {
        //                 if (vm.item_branch_list[x].branch == branch.id) {
        //                     delete vm.item_branch_list[x].is_deleted;
        //                     add_to_store = false;
        //                     break;
        //                 }
        //             }
        //             if (add_to_store) {
        //                 add_to_store_count++;
        //                 vm.item.branch = branch.id;
        //                 vm.item.id = null;
        //                 vm.item.branch_name = branch.name;
        //                 new_item = JSON.parse(JSON.stringify(vm.item));
        //                 vm.product.item_details.push(new_item);
        //                 _add_new_branch_details.push(new_item);
        //             }
        //         });
        //         if (vm.product.product_type === product_kit && _add_new_branch_details.length !== 0) {
        //             $scope.$broadcast("new_branch_item", _add_new_branch_details);
        //         }
        //         vm.item_branch_list_count = vm.product.item_details.length;
        //         vm.set_product_prices();
        //         vm.get_branch_records(false);
        //         if (vm.is_item_displayed) {
        //             vm.item = JSON.parse(JSON.stringify(saved_item));
        //             vm.set_item_prices();
        //         }
        //         //
        //         //         //Removed as a part of kit/shipper development. Now we are doing global save a single time. Not when the branch is added.Commenting the code temporarily untill tsting is done.
        //         //         // product_product_service.update_record(vm.product, util.ad_patch_options(false)).then(function (product) {
        //         //         //     vm.product = product;
        //         //         //     //vm.set_uom_for_default_uom_data_source();
        //         //         //     vm.set_product_prices();
        //         //         //     vm.get_branch_records(false);
        //         //         //
        //         //         //     if (vm.is_item_displayed) {
        //         //         //         vm.item = JSON.parse(JSON.stringify(saved_item));
        //         //         //         vm.set_item_prices();
        //         //         //     }
        //         //         //     vm.save_toolbar_button.success();
        //         //         //     var location_display = $rootScope.rs_toogo_user.configurations.location_display_plural;
        //         //         //     if (add_to_store_count == 1) {
        //         //         //         location_display = $rootScope.rs_toogo_user.configurations.location_display_label;
        //         //         //     }
        //         //         //     StdDialog.information("Item successfully added to " + add_to_store_count.toString() + " " +
        //         //         //         location_display + ".");
        //         //         // }, function error(reason) {
        //         //         //     vm.save_toolbar_button.failure();
        //         //         //     $timeout(function () {
        //         //         //         util.handleErrorWithWindow(reason);
        //         //         //     }, 2500);
        //         //         // });
        //         //     });
        //     });
        // }
    };

    const _populate_item_details = function (branch_list, is_add_multiple_stores) {
        var _add_new_branch_details = [];
        const amount = vm.selling_price.amount;
        if (!vm.add_mode) {
            var saved_item = {};
            var x = 0;
            var add_to_store = true;
            var add_to_store_count = 0;
            if (vm.is_item_displayed) {
                saved_item = vm.item;
            }

            vm.item = {};
            vm.item.prices = [];
            //Checking the Price Kept when it is By Location so that item detail are populated
            if (vm.product.price_by != 2) {
                if (!vm.selling_price.item_id) {
                    vm.selling_price.item_id = null;
                }
                vm.item.prices.push({
                    price_type: vm.system_default_price_type,
                    uom: vm.product_selling_uom,
                    uom_code: vm.product_selling_uom_name,
                    price: parseFloat(vm.selling_price.amount),
                    selling_multiple: vm.product_selling_uom_multiple,
                    is_default: true,
                    is_active: true,
                    id: vm.selling_price.item_id,
                    product_price: vm.selling_price.product_price,
                    variant: vm.variant_main_value
                });
                // Add in the alternate item level price types
                vm.alternate_selling_price = vm.alternate_unit_grid_data_source.data().toJSON();
                angular.forEach(vm.alternate_selling_price, function (alternate_price) {
                    if (!alternate_price.item_id) {
                        alternate_price.item_id = null;
                    }

                    // vm.item.prices.push({
                    //     price_type: parseInt(alternate_price.price_type),
                    //     uom: parseInt(alternate_price.selling_price_uom),
                    //     price: parseFloat(alternate_price.selling_item_amount),
                    //     selling_multiple: alternate_price.selling_multiple,
                    //     is_default: false,
                    //     is_active: alternate_price.is_active,
                    //     variant: vm.variant_main_value,
                    //     id: alternate_price.item_id,
                    //     product_price: alternate_price.product_price
                    // });

                    vm.item.prices.push({
                        price_type: parseInt(alternate_price.price_type),
                        uom: alternate_price.selling_price_uom ? parseInt(alternate_price.selling_price_uom) : alternate_price.uom,
                        price: alternate_price.price ? parseFloat(alternate_price.price) : 0,
                        selling_multiple: alternate_price.selling_multiple,
                        is_default: false,
                        is_active: alternate_price.is_active ? alternate_price.is_active : false,
                        variant: vm.variant_main_value,
                        id: alternate_price.item_id,
                        product_price: alternate_price.product_price,

                        //Newly added keys for grid implementation for alternate units
                        default_text: alternate_price.default_text,
                        discount_off_retail_percent: alternate_price.price_method === 1 ? alternate_price.markup_price : null,
                        markup_from_retail_percent: alternate_price.price_method === 2 ? alternate_price.markup_price : null,
                        markup_price: alternate_price.markup_price,
                        newly_added: alternate_price.newly_added,
                        price_method_name: alternate_price.price_method_name,
                        product_gross_profit: alternate_price.product_gross_profit,
                        rounding_method: alternate_price.rounding_method,
                        rounding_method_name: alternate_price.rounding_method_name,
                        selling_product_amount: alternate_price.selling_product_amount,
                        stocking_price_uom_name: alternate_price.stocking_price_uom_name,
                        price_method: alternate_price.price_method,
                        temp_id: alternate_price.temp_id,
                        selling_price_uom_name: alternate_price.selling_price_uom_name
                    });
                });
            }
            vm.item.costs = [];
            vm.item.stocking = {};
            vm.item.selling = {};
            vm.item.buying = {};
            vm.item.buying.suppliers = [];
            if (vm.product.product_type == product_shipper) {
                if (Object.keys(saved_item).length !== 0) {
                    vm.item.buying = JSON.parse(JSON.stringify(saved_item.buying));
                } else {
                    for (var i = 0; i < vm.item_branch_list.length; i++) {
                        if (!vm.item_branch_list[i].hasOwnProperty('is_deleted')) {
                            vm.item.buying = angular.copy(vm.item_branch_list[i].buying);
                            break;
                        }
                    }
                }
                angular.forEach(vm.item.buying.suppliers, function (supplier) {
                    supplier.id = null;
                    supplier.variant = null;
                    supplier.last_cost_change_date = null;
                    supplier.last_po_number = null;
                    supplier.last_purchase_quantity = null;
                    supplier.last_received_cost = null;
                    supplier.last_received_date = null;
                });
            }

            if (vm.product.product_type !== product_shipper && vm.product.product_type !== product_fee) {
                vm.item.stocking = {
                    overall_qty_on_hand: 0.0,
                    overall_qty_on_order: 0.0,
                    overall_qty_committed: 0.0,
                    overall_qty_available: 0.0,
                    overall_qty_defective: 0.0,
                    overall_average_cost: null,
                    overall_last_received_cost: 0.0,
                    overall_last_received_date: null
                };
            }
            vm.item.selling = {};
            vm.item.selling.is_discountable = true;
            vm.item.is_returnable = true;
            vm.item.selling.is_taxable = true;
            vm.item.selling.is_loyalty_active = true;
            vm.item.stocking.track_inventory = true;
            vm.item.stocking.is_stocked = true;
            if (vm.product.product_type === product_shipper || vm.product.product_type === product_fee) {
                vm.item.stocking.track_inventory = false;
                vm.item.stocking.is_stocked = false;
            }

            vm.item.record_added_date = moment(Date.now()).format('YYYY-MM-DD');

            vm.item.stocking.bin_locations = [];
            vm.item.stocking.stocking_uom = {};
            vm.item.selling.tax_code_id = null;
            vm.item.selling.label_count_type = null;
            vm.item.selling.label_count_type = 1;
            vm.item.selling.label_count = null;
            vm.item.selling.selling_uom = {};


            //check if it already exists in this store/branch
            angular.forEach(branch_list, function (branch) {
                add_to_store = true;
                for (x = 0; x < vm.item_branch_list.length; x++) {
                    //Executed when adding a single store
                    if (vm.item_branch_list[x].branch == branch && !is_add_multiple_stores) {
                        //If deleted item is added again then just remove the flag from the object.
                        delete vm.item_branch_list[x].is_deleted;
                        add_to_store = false;
                        break;
                    }

                    //Executed when adding all stores
                    if (vm.item_branch_list[x].branch == branch.id && is_add_multiple_stores) {
                        //If deleted item is added again then just remove the flag from the object.
                        delete vm.item_branch_list[x].is_deleted;
                        add_to_store = false;
                        break;
                    }
                }
                if (add_to_store) {
                    vm.new_item = JSON.parse(JSON.stringify(vm.item));
                    if (is_add_multiple_stores) {
                        vm.new_item.branch = branch.id;
                    } else {
                        vm.new_item.branch = branch;
                    }
                    // INV-1229 - Copy the Supplier to Item when Adding Item to another store. Copy from current store.
                    if (vm.is_item_displayed && saved_item.buying.suppliers.length > 0) {
                        vm.new_item.buying = JSON.parse(JSON.stringify(saved_item.buying));
                        angular.forEach(vm.new_item.buying.suppliers, function (supplier) {
                            //The supplier_iu id must be null for newly added supplier to a store
                            supplier.id = null;
                            supplier.last_cost_change_date = null;
                            supplier.last_po_number = null;
                            supplier.last_purchase_quantity = null;
                            supplier.last_received_cost = null;
                            supplier.last_received_date = null;
                        });
                    }

                    //Adding the extra fields require for save */
                    vm.new_item.in_estore = false;
                    vm.new_item.is_loyalty_active = true;
                    vm.new_item.is_returnable = true;
                    vm.new_item.item_tags = [];
                    vm.new_item.last_returned_date = null;
                    vm.new_item.last_sold_date = null;
                    if (is_add_multiple_stores) {
                        vm.new_item.branch_name = branch.name;
                        vm.new_item.branch_number = branch.branch_number;
                    } else {
                        var branch_data = vm.item_branch_data_source.get(branch).toJSON();
                        vm.new_item.branch_name = branch_data.name;
                        vm.new_item.branch_number = branch_data.branch_number;
                    }

                    vm.product.item_details.push(vm.new_item);
                    add_to_store_count += 1;
                    var deleted_branch_list = vm.item_branch_list.filter(function (item) {
                        return item.is_deleted === true;
                    });
                    vm.item_branch_list_count = (vm.item_branch_list.length - deleted_branch_list.length);
                    _add_new_branch_details.push(vm.new_item);
                }
            });

            if (vm.product.product_type === product_kit && _add_new_branch_details.length !== 0) {
                //Add the new item to original item details, needed when pricing method is "Set Price"
                $scope.$broadcast("new_branch_item", _add_new_branch_details, vm.selling_price.amount);
            }
            /*
             * This save of the product is just a quick save for adding a store
             * to a product.  It should not attempt to update images, so
             * remove it from the update.
             */
            if (vm.product.images !== angular.isUndefined && vm.product.images !== null) {
                delete vm.product.images;
            }
            if (vm.all_inventory_access_obj.access_price_cost) {
                vm.set_product_prices();
            }
            vm.get_branch_records(false);
            if (vm.is_item_displayed) {
                angular.forEach(vm.product.item_details, function (item_detail) {
                    if (item_detail.branch == saved_item.branch) {
                        vm.item = item_detail;
                        vm.set_item_prices();
                        return;
                    }
                });
            }
        }
        vm.selling_price.amount = amount;
        vm.item_add_to_stores = [];
    };


    vm.add_more_store_save = function () {
        const _add_new_branch_details = [];
        vm.show_add_to_stores = false;
        var is_add_multiple_stores = false;
        close_store_list_panel();
        _populate_item_details(vm.item_add_to_stores, is_add_multiple_stores);

        //Commenting the below code due to the implementation was different for adding a single store vs multiple stores.
        // Code Will remain commented until we test the code perfectly. Made the multi add code implementation same way as "single add"

        // if (!vm.add_mode) {
        //     var saved_item = {};
        //     var x = 0;
        //     var add_to_store = true;
        //     var add_to_store_count = 0;
        //     if (vm.is_item_displayed) {
        //         //Update the current price for present branch
        //         for(var i=0;i<vm.item.prices.length;i++){
        //             var _obj_price = {};
        //             _obj_price = vm.item.prices[i];
        //             if(_obj_price.is_default && _obj_price.is_active){
        //                 vm.item.prices[i].price = vm.selling_price.amount;
        //             }
        //         }
        //         saved_item = vm.item;
        //     }
        //
        //     vm.item = {};
        //     vm.item.prices = [];
        //     if (vm.product.price_by != 2) {
        //         if (!vm.selling_price.item_id) {
        //             vm.selling_price.item_id = null;
        //         }
        //         vm.item.prices.push({
        //             price_type: vm.system_default_price_type,
        //             uom: vm.product_selling_uom,
        //             uom_code: vm.product_selling_uom_name,
        //             price: parseFloat(vm.selling_price.amount),
        //             selling_multiple: vm.product_selling_uom_multiple,
        //             is_default: true,
        //             is_active: true,
        //             id: vm.selling_price.item_id,
        //             product_price: vm.selling_price.product_price,
        //             variant: vm.variant_main_value
        //         });
        //         // Add in the alternate item level price types
        //         angular.forEach(vm.alternate_selling_price, function (alternate_price) {
        //             if (!alternate_price.item_id) {
        //                 alternate_price.item_id = null;
        //             }
        //             vm.item.prices.push({
        //                 price_type: parseInt(alternate_price.price_type),
        //                 uom: parseInt(alternate_price.selling_price_uom),
        //                 price: parseFloat(alternate_price.selling_item_amount),
        //                 selling_multiple: alternate_price.selling_multiple,
        //                 is_default: false,
        //                 is_active: alternate_price.is_active,
        //                 variant: vm.variant_main_value,
        //                 id: alternate_price.item_id,
        //                 product_price: alternate_price.product_price
        //             });
        //         });
        //     }
        //     vm.item.costs = [];
        //     vm.item.stocking = {};
        //     vm.item.selling = {};
        //     vm.item.buying = {};
        //     vm.item.buying.suppliers = [];
        //     if (vm.product.product_type == product_shipper){
        //         vm.item.buying = JSON.parse(JSON.stringify(saved_item.buying));
        //         angular.forEach(vm.item.buying.suppliers, function (supplier) {
        //             supplier.id = null;
        //             supplier.variant = null;
        //         });
        //     }
        //
        //     if(vm.product.product_type !== product_shipper && vm.product.product_type !== product_fee) {
        //         vm.item.stocking = {
        //             overall_qty_on_hand: 0.0,
        //             overall_qty_on_order: 0.0,
        //             overall_qty_committed: 0.0,
        //             overall_qty_available: 0.0,
        //             overall_qty_defective: 0.0,
        //             overall_average_cost: null,
        //             overall_last_received_cost: 0.0,
        //             overall_last_received_date: null
        //         };
        //     }
        //     vm.item.selling = {};
        //     vm.item.selling.is_discountable = true;
        //     vm.item.is_returnable = true;
        //     vm.item.selling.is_taxable = true;
        //     vm.item.selling.is_loyalty_active = false;
        //     vm.item.stocking.track_inventory = true;
        //     vm.item.stocking.is_stocked = true;
        //     if(vm.product.product_type === product_shipper || vm.product.product_type === product_fee){
        //         vm.item.stocking.track_inventory = false;
        //         vm.item.stocking.is_stocked = false;
        //     }
        //
        //     vm.item.record_added_date = Date.now();
        //
        //     vm.item.stocking.bin_locations = [];
        //     vm.item.stocking.stocking_uom = {};
        //     vm.item.selling.tax_code_id = null;
        //     vm.item.selling.label_count_type = null;
        //     vm.item.selling.label_count_type = 1;
        //     vm.item.selling.label_count = null;
        //     vm.item.selling.selling_uom = {};
        //
        //
        //     //check if it already exists in this store/branch
        //     angular.forEach(vm.item_add_to_stores, function (branch) {
        //         add_to_store = true;
        //         for (x = 0; x < vm.item_branch_list.length; x++) {
        //             if (vm.item_branch_list[x].branch == branch) {
        //                 //If deleted item is added again then just remove the flag from the object.
        //                 delete vm.item_branch_list[x].is_deleted;
        //                 add_to_store = false;
        //                 break;
        //             }
        //         }
        //         if (add_to_store) {
        //             vm.new_item = JSON.parse(JSON.stringify(vm.item));
        //             vm.new_item.branch = branch;
        //             ///vm.new_item.id = branch;
        //
        //             //Adding the extra fields require for save */
        //             vm.new_item.in_estore = false;
        //             vm.new_item.is_loyalty_active;false;
        //             vm.new_item.is_returnable = true;
        //             vm.new_item.item_tags = [];
        //             vm.new_item.last_returned_date = null;
        //             vm.new_item.last_sold_date = null;
        //             var branch_data = vm.item_branch_data_source.get(branch).toJSON();
        //             vm.new_item.branch_name = branch_data.name;
        //             vm.new_item.branch_number = branch_data.branch_number;
        //             vm.product.item_details.push(vm.new_item);
        //             add_to_store_count += 1;
        //             vm.item_branch_list_count = vm.item_branch_list.length;
        //             _add_new_branch_details.push(vm.new_item);
        //         }
        //     });
        //     if(vm.product.product_type === product_kit && _add_new_branch_details.length !==0){
        //         //Add the new item to original item details, needed when pricing method is "Set Price"
        //         $scope.$broadcast("new_branch_item",_add_new_branch_details);
        //     }
        //     /*
        //      * This save of the product is just a quick save for adding a store
        //      * to a product.  It should not attempt to update images, so
        //      * remove it from the update.
        //      */
        //     if (vm.product.images !== angular.isUndefined && vm.product.images !== null) {
        //         delete vm.product.images;
        //     }
        //
        //     vm.set_product_prices();
        //     vm.get_branch_records(false);
        //     if (vm.is_item_displayed) {
        //         angular.forEach(vm.product.item_details, function (item_detail) {
        //             if (item_detail.id == saved_item.id) {
        //                 vm.item = saved_item;
        //                 vm.set_item_prices();
        //             }
        //         });
        //     }
        //
        //     //Removed as a part of kit/shipper development. Now we are doing global save a single time. Not when the branch is added. Commenting the code temporarily untill tsting is done.
        //     // product_product_service.update_record(vm.product, util.ad_patch_options(false)).then(function (product) {
        //     //     vm.product = product;
        //     //     //vm.set_uom_for_default_uom_data_source();
        //     //     vm.set_product_prices();
        //     //     vm.get_branch_records(false);
        //     //     if (vm.is_item_displayed) {
        //     //         angular.forEach(vm.product.item_details, function (item_detail) {
        //     //             if (item_detail.id == saved_item.id) {
        //     //                 vm.item = item_detail;
        //     //                 vm.set_item_prices();
        //     //             }
        //     //         });
        //     //     }
        //     //     var location_display = $rootScope.rs_toogo_user.configurations.location_display_plural;
        //     //     if (add_to_store_count == 1) {
        //     //         location_display = $rootScope.rs_toogo_user.configurations.location_display_label;
        //     //     }
        //     //     StdDialog.information("Item successfully added to " + add_to_store_count.toString() + " " +
        //     //         location_display + ".");
        //     // }, function error(reason) {
        //     //     $timeout(function () {
        //     //         util.handleErrorWithWindow(reason);
        //     //     }, 2500);
        //     // });
        // }
        // vm.item_add_to_stores = [];

    };

    vm.add_more_store_close = function () {
        vm.item_add_to_stores = [];
        vm.show_add_to_stores = false;

        close_store_list_panel();
    };

    vm.add_store_close = function () {
        vm.item_add_to_stores = [];
        vm.show_add_to_stores = false;

        close_store_list_panel();
    };
    // Todo kld - fix this
    vm.purchase_uom_selected = function (event) {
        vm.item_purchase_uom.uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        vm.tmp_value_id = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
    };
    vm.supplier_purchase_uom_selected = function (event) {
        vm.edit_supplier.uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };
    vm.sell_uom_selected = function (event) {
        vm.item_sell_uom.uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };
    vm.stock_uom_selected = function (event) {
        vm.item_stock_uom.uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        vm.item.stocking.uom_name = vm.item_stock_uom.uom_name;
    };
    vm.product_purchase_uom_selected = function (event) {
        vm.item_purchase_uom.uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        vm.tmp_value_id = event.sender.dataItem(event.item)[event.sender.options.dataValueField];
        vm.product_purchasing_uom_name = vm.item_purchase_uom.uom_name;
        vm.product.default_purchasing_uom = vm.product_purchasing_uom;
        vm.product.default_purchasing_uom_name = vm.product_purchasing_uom_name;
        if (vm.product_purchasing_uom_name == vm.product_stocking_uom_name) {
            vm.product_purchasing_uom_multiple = 1.00;
        } else {
            vm.product_order_quantity_multiple = 1.00;
        }
    };
    vm.product_sell_uom_selected = function (event) {
        vm.uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        vm.product.default_selling_uom = vm.product_selling_uom;
        vm.product_selling_uom_name = vm.uom_name;
        vm.product.default_selling_uom_name = vm.product_selling_uom_name;
        if (vm.product_selling_uom_name == vm.product_stocking_uom_name) {
            vm.product_selling_uom_multiple = 1.00;
        }
        recalculate_gross_profit();
    };
    vm.product_stock_uom_selected = function (event) {
        vm.item_stock_uom.uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        vm.item.stocking.uom_name = vm.item_stock_uom.uom_name;
        vm.product_stocking_uom_name = vm.item.stocking.uom_name;
        vm.product.stocking_uom = vm.product_stocking_uom;
        vm.product.stocking_uom_name = vm.product_stocking_uom_name;
        recalculate_gross_profit();
    };


    vm.product_attribute_add = function () {

        if (vm.edit_product_attributes == null) {
            vm.edit_product_attributes = [];
        }

        if (vm.edit_product_attributes.length < 3) {
            vm.edit_product_attributes.push({
                attribute_values: []
            });
            if (vm.buying_variant_field < 10) {
                vm.buying_variant_value_disabled = false;

            }
            if (vm.pricing_variant_field < 10) {
                vm.pricing_variant_value_disabled = false;
            }
        } else {
            StdDialog.error("A maximum of three attributes are allowed for a product.");
        }

    };

    vm.product_attribute_delete = function (the_index) {
        angular.forEach(vm.edit_product_attributes[the_index].attribute_values, function (attribute_value) {
            removeVariantValue([attribute_value.id]);
        });

        vm.edit_product_attributes.splice(the_index, 1);
        vm.set_item_variant_grid_options();
    };

    vm.get_filter_class = function (filter_type) {
        if (filter_type == vm.history_time_type && vm.is_item_displayed) {
            return "k-button active_tab_focus";
        } else {
            return "k-button";
        }
    };

    vm.history_filter = function (filter_type) {

        if (vm.is_item_displayed == true) {
            vm.history_time_type = filter_type;
            vm.set_item_history_data_source();
        }
    };

    /***************************************************************************************************
     * *************************************************************************************************
     * ************************** MODALS** *************************************************************
     * *************************************************************************************************
     * *************************************************************************************************
     */
    $scope.$on("item_quick_add_from_component", function (event, args) {

        vm.item_quick_add_clicked(args.event_data_from_component)
    });


    vm.add_or_remove_mandatory_class = function () {

        if (vm.new_item.product_type === product_standard || vm.new_item.product_type === product_firearm || vm.new_item.product_type === product_fee) {
            var retail_price = $('#new_price_amount');
            var retail_price_widget = kendo.widgetInstance(retail_price);
            var cost_amount = $('#new_cost_amount');
            var cost_amount_widget = kendo.widgetInstance(cost_amount);
            var desired_gp = $('#new_desired_gp');
            var desired_gp_widget = kendo.widgetInstance(desired_gp);
            if (vm.new_item.price_amount != null && (vm.new_item.cost_amount === null && vm.new_item.desired_gp_percent === null)) {
                cost_amount_widget.wrapper[0].childNodes[0].classList.add("ep-required-flag-invalid");
                desired_gp_widget.wrapper[0].childNodes[0].classList.add("ep-required-flag-invalid");
            } else if (vm.new_item.cost_amount != null && (vm.new_item.price_amount === null && vm.new_item.desired_gp_percent === null)) {
                retail_price_widget.wrapper[0].childNodes[0].classList.add("ep-required-flag-invalid");
                desired_gp_widget.wrapper[0].childNodes[0].classList.add("ep-required-flag-invalid");
            } else if (vm.new_item.desired_gp_percent != null && (vm.new_item.price_amount === null && vm.new_item.cost_amount === null)) {
                retail_price_widget.wrapper[0].childNodes[0].classList.add("ep-required-flag-invalid");
                cost_amount_widget.wrapper[0].childNodes[0].classList.add("ep-required-flag-invalid");
            } else if (vm.new_item.price_amount != null && vm.new_item.cost_amount != null) {
                desired_gp_widget.wrapper[0].childNodes[0].classList.remove("ep-required-flag-invalid");

            } else if (vm.new_item.price_amount != null && vm.new_item.desired_gp_percent != null) {
                cost_amount_widget.wrapper[0].childNodes[0].classList.remove("ep-required-flag-invalid");
            } else if (vm.new_item.cost_amount != null && vm.new_item.desired_gp_percent != null) {
                retail_price_widget.wrapper[0].childNodes[0].classList.remove("ep-required-flag-invalid");
            }

        }
    };
    vm.item_quick_add_clicked = function (data_from_child) {
        vm.new_item.supplier = "";

        // vm.new_item.sku=data_from_child.sku_val;

        if (arguments.length > 0) {
            vm.is_new_item_from_component_tab = data_from_child.is_new_item_from_component_tab;
            vm.call_back_to_child = data_from_child.call_back_to_child;
            vm.is_default_supplier_defined = data_from_child.is_default_supplier_defined;

            if (vm.product.product_type === 2) {
                vm.product_type_data_source = new kendo.data.DataSource({
                    data: vm.product_choices.kit_product_type
                });
            } else {
                if (vm.is_default_supplier_defined)
                    vm.new_item.supplier = vm.item.buying.suppliers[0].supplier;
                vm.product_type_data_source = new kendo.data.DataSource({
                    data: vm.product_choices.shipper_product_type
                });
            }


            var buttons = [
                {
                    text: "Cancel",
                    primary: false,
                    callback: vm.item_quick_add_cancel_response,
                    disable_if: "product_controller.item_add_kitshipper_save_button.submitting || product_controller.item_add_kitshipper_save_button.submitting"
                },
                {
                    text: "Save",
                    primary: true,
                    animated_button: vm.item_add_kitshipper_save_button,
                    callback: vm.item_add_kitshipper_button_click,
                    disable_if: "product_controller.item_add_kitshipper_save_button.submitting"
                }
            ];

        } else {
            vm.pre = "new_";
            vm.product_type_data_source = new kendo.data.DataSource({
                data: vm.product_choices.product_type
            });
            vm.is_new_item_from_component_tab = false;
            vm.call_back_to_child = null;

            var buttons = [
                {
                    text: "Cancel",
                    primary: false,
                    callback: vm.item_quick_add_cancel_response,
                    disable_if: "product_controller.item_add_save_and_add_button.submitting || product_controller.item_add_save_and_edit_button.submitting"
                },
                {
                    text: "Save & Edit",
                    primary: true,
                    animated_button: vm.item_add_save_and_edit_button,
                    callback: vm.item_quick_add_edit_button_click,
                    disable_if: "product_controller.item_add_save_and_add_button.submitting"
                },
                {
                    text: "Save & Add More",
                    primary: false,
                    animated_button: vm.item_add_save_and_add_button,
                    callback: vm.item_quick_add_save_button_click,
                    disable_if: "product_controller.item_add_save_and_edit_button.submitting"
                }

            ];

        }

        vm.modal_window_size = 'lg';

        /*vm.new_item_category_filter = {list_type: 'hierarchical_list'};
        vm.new_item_category_hierarchical_datasource = product_category_hierarchical_service.get_record_server_filter_hierarchical_data_source(util.ad_find_options(true, false),
            vm.new_item_category_filter, 99999, $scope);*/
        vm.new_item_category_highlighted = false;

        vm.new_item_category_tree_view_options = {
            // dataBound: function() {
            //     vm.focus_category_tree_search = true;
            //     highlight_new_item_category(vm.new_item_category_highlighted);
            // },
            loadOnDemand: true
        };


        /*vm.new_product_supplier_data_source = supplier_supplier_with_all_service.get_record_server_filter_data_source(util.ad_find_options(true, false),
            supplier_supplier_with_all_service.filter_dropdown_list(), 32, $scope);*/

        vm.new_item.category = 0;
        vm.new_item.item_details = "";
        vm.new_item.selling_uom = vm.system_default_stocking_uom;
        vm.new_item.stocking_uom = vm.system_default_stocking_uom;
        vm.new_item.purchase_uom = vm.system_default_stocking_uom;
        vm.new_item.order_multiple = 1;
        vm.new_item.description = "";
        vm.new_item.product_type = product_standard;
        vm.new_item.price_amount = null;
        vm.new_item.cost_amount = null;
        vm.new_firearm_type = null;
        vm.new_firearm_manufacturer = "";
        vm.new_firearm_model = "";
        vm.new_firearm_caliber_or_gauge = "";
        vm.new_item.price_by = 2;
        vm.new_item.kit_price_option = null;
        vm.new_item.kit_discount_off_retail_percent = null;
        vm.new_item.kit_markup_from_cost_percent = null;
        vm.new_item.set_price = null;
        vm.new_item.sku = vm.is_new_item_from_component_tab ? data_from_child.sku_val : null;
        vm.new_item.is_discountable = true;
        vm.new_item.sell_price_type = 0;
        vm.new_item_selected_category = "Select Category";
        vm.new_item_selected_category_id = 0;
        vm.new_item.is_active = true;
        vm.new_item.stores = [];
        vm.new_item.desired_gp_percent = null;
        vm.new_item.bin_location = "";
        vm.disable_price_by = false;  // For gift card type

        //  vm.new_item.product_type =null;

        vm.focus_new_sku = true;
        if (angular.isDefined(data_from_child)) {
            vm.new_item_component_qty = data_from_child.default_qty;
        }


        vm.item_quick_add_dialog = StdDialog.custom({
            size: vm.modal_window_size,
            title: "Add New Product",
            show_title_bar: true,
            templateUrl: 'app/product/product_maintenance/views/templates/product_item_add.html',
            windowClass: 'ep-alert-override-modal',
            auto_close: false,
            auto_focus: false,
            controller_name: "product_controller",
            scope: $scope,
            icon: "mdi mdi-cube-outline",
            buttons: buttons,
            button_type: 'link',
            is_keyboard_support_required: true,
            back_action: vm.item_quick_add_cancel_response
        });

    };

    vm.item_quick_add_save_button_click = function () {
        item_quick_add_save_response(true);
    };

    vm.item_quick_add_edit_button_click = function () {
        clear_product_list();
        item_quick_add_save_response(false);
    };

    vm.item_add_kitshipper_button_click = function () {
        //KitComponent SAve

        item_quick_add_save_response(false, vm.call_back_to_child);
    };

    const item_quick_add_save_response = function (add_more, call_back) {
        var save_current_product = {};
        var save_current_item = {};
        var x = 0;
        var new_prices = [];
        var new_costs = [];
        vm.is_default_supplier_defined = false;
        vm.item_quick_add_dialog.remove_inline_error_message();
        if (vm.new_item_category.isopen) {
            vm.new_item_category.isopen = false;
        }
        if (valid_product_add()) {
            if (add_more) {
                vm.item_add_save_and_add_button.start();

            } else {

                if (vm.is_new_item_from_component_tab) {
                    vm.item_add_kitshipper_save_button.start();
                } else {
                    vm.item_add_save_and_edit_button.start();
                }


            }
            save_current_product = vm.product;
            save_current_item = vm.item;
            let new_product_details = {};
            let bin_location = [];

            new_product_details.sku = vm.new_item.sku;
            // new_product_details.description = vm.new_item.description;  commented out per PO
            new_product_details.description = vm.new_item.description;
            new_product_details.category = vm.new_item_selected_category_id;
            new_product_details.category_name = vm.new_item_selected_category;
            new_product_details.price_by = vm.new_item.price_by;
            new_product_details.default_selling_uom = vm.new_item.selling_uom;
            new_product_details.default_selling_multiple = 1;
            new_product_details.product_type = vm.new_item.product_type;
            var retail_price = vm.new_item.price_amount;
            if (vm.system_default_stocking_uom == null) {
                new_product_details.stocking_uom = vm.new_item.selling_uom;
            } else {
                new_product_details.stocking_uom = vm.system_default_stocking_uom;
            }
            new_product_details.default_purchasing_uom = vm.new_item.purchase_uom;
            new_product_details.default_purchasing_multiple = vm.new_item.order_multiple;

            //for Firearms and Standard and fee
            if (new_product_details.product_type === product_firearm || new_product_details.product_type === product_standard || new_product_details.product_type === product_fee) {
                new_product_details.desired_gp_percent = vm.new_item.desired_gp_percent;
            }

            // For gift card product_gift_card
            if (new_product_details.product_type === product_gift_card)
                new_product_details.gift_card_type = vm.new_item.gift_card_type;

            //For Firearms
            if (new_product_details.product_type === product_firearm) {
                new_product_details.firearm_type = vm.new_firearm_type;
                new_product_details.firearm_manufacturer = vm.new_firearm_manufacturer;
                new_product_details.firearm_model = vm.new_firearm_model;
                new_product_details.firearm_caliber_or_gauge = vm.new_firearm_caliber_or_gauge;
            }

            // For Kits
            if (new_product_details.product_type === product_kit) {
                new_product_details.default_purchasing_uom = null;
                new_product_details.kit_discount_off_retail_percent = vm.new_item.kit_discount_off_retail_percent;
                new_product_details.kit_markup_from_cost_percent = vm.new_item.kit_markup_from_cost_percent;
                new_product_details.kit_price_option = vm.new_item.kit_price_option;
                if (new_product_details.kit_price_option !== 0) {
                    retail_price = 0;
                } else {
                    retail_price = vm.new_item.set_price;
                }
                new_product_details.default_purchasing_multiple = 1;
            }

            //For Shipper
            if (new_product_details.product_type === product_shipper) {
                new_product_details.kit_shipper_supplier = vm.new_item.supplier;
                retail_price = 0;
            }

            //For Membership Fee
            if (vm.new_item.product_type === product_membership_fee) {
                new_product_details.description = vm.new_item.item_details;
                new_product_details.default_purchasing_uom = null;
            }

            new_product_details.product_variants = [{
                product_attribute_value_1: null,
                product_attribute_value_2: null,
                product_attribute_value_3: null,
                alternate_codes: [],
                product_prices: [{
                    is_default: true,
                    uom: new_product_details.default_selling_uom,
                    selling_multiple: new_product_details.default_selling_multiple,
                    price_type: vm.system_default_price_type,
                    default_text: vm.system_default_price_type_name,
                    price: retail_price
                }]
            }];
            new_product_details.item_details = [];
            if (vm.new_item.bin_location) {
                bin_location.push({name: vm.new_item.bin_location, is_primary: true});
            }

            if (vm.new_item.stores && vm.new_item.stores.length > 0) {
                if (vm.new_item.stores[0] == '-1') {
                    new_product_details.add_all_stores = true;
                }

                for (x = 0; x < vm.new_item.stores.length; x++) {
                    var order_quantity_multiple;
                    var stocking_multiple;
                    if (vm.new_item.purchase_uom == new_product_details.stocking_uom) {
                        order_quantity_multiple = vm.new_item.order_multiple;
                        stocking_multiple = 1;
                    } else {
                        order_quantity_multiple = 1;
                        stocking_multiple = vm.new_item.order_multiple;
                    }
                    if (new_product_details.price_by != 2) {
                        // For Kit, only the retail is sent

                        if (new_product_details.product_type === product_gift_card && vm.new_item.gift_card_type) {
                            vm.new_item.desired_gp_percent = 0.00;
                            if (vm.new_item.gift_card_type != 40) {
                                vm.new_item.cost_amount = (vm.new_item.cost_amount === undefined ||
                                    vm.new_item.cost_amount === null) ? null : vm.new_item.cost_amount;
                                new_product_details.item_details.push({
                                    branch: vm.new_item.stores[x],
                                    prices: [{
                                        is_default: true,
                                        uom: new_product_details.default_selling_uom,
                                        selling_multiple: new_product_details.default_selling_multiple,
                                        is_active: true,
                                        id: null,
                                        price_type: vm.system_default_price_type,
                                        default_text: vm.system_default_price_type_name,
                                        price: retail_price

                                    }],
                                    costs: [{
                                        replacement_costs: vm.new_item.cost_amount
                                    }],
                                    buying: {
                                        suppliers: [{
                                            supplier: vm.new_item.supplier,
                                            id: null,
                                            replacement_cost: vm.new_item.cost_amount,
                                            supplier_uom: vm.new_item.purchase_uom,
                                            order_quantity_multiple: order_quantity_multiple,
                                            stocking_multiple: stocking_multiple
                                        }]
                                    },
                                    stocking: {
                                        bin_locations: bin_location
                                    }
                                });
                            } else {
                                vm.new_item.cost_amount = (vm.new_item.cost_amount === undefined ||
                                    vm.new_item.cost_amount === null) ? null : vm.new_item.cost_amount;
                                new_product_details.item_details.push({
                                    branch: vm.new_item.stores[x],
                                    prices: [{
                                        is_default: true,
                                        uom: new_product_details.default_selling_uom,
                                        selling_multiple: new_product_details.default_selling_multiple,
                                        is_active: true,
                                        id: null,
                                        price_type: vm.system_default_price_type,
                                        default_text: vm.system_default_price_type_name,
                                        price: retail_price

                                    }],
                                    costs: [{
                                        replacement_costs: vm.new_item.cost_amount
                                    }]
                                });
                            }
                        } else if (new_product_details.product_type === product_kit) {
                            new_product_details.item_details.push({
                                branch: vm.new_item.stores[x],
                                prices: [{
                                    is_default: true,
                                    uom: new_product_details.default_selling_uom,
                                    selling_multiple: new_product_details.default_selling_multiple,
                                    is_active: true,
                                    id: null,
                                    price_type: vm.system_default_price_type,
                                    default_text: vm.system_default_price_type_name,
                                    price: retail_price

                                }],
                                costs: [],
                                buying: {}
                            });
                        } else {
                            vm.new_item.cost_amount = (vm.new_item.cost_amount === undefined ||
                                vm.new_item.cost_amount === null) ? null : vm.new_item.cost_amount;
                            new_product_details.item_details.push({
                                branch: vm.new_item.stores[x],
                                prices: [{
                                    is_default: true,
                                    uom: new_product_details.default_selling_uom,
                                    selling_multiple: new_product_details.default_selling_multiple,
                                    is_active: true,
                                    id: null,
                                    price_type: vm.system_default_price_type,
                                    default_text: vm.system_default_price_type_name,
                                    price: retail_price

                                }],
                                costs: [{
                                    replacement_costs: vm.new_item.cost_amount
                                }],
                                buying: {
                                    suppliers: [{
                                        supplier: vm.new_item.supplier,
                                        id: null,
                                        replacement_cost: vm.new_item.cost_amount,
                                        supplier_uom: vm.new_item.purchase_uom,
                                        order_quantity_multiple: order_quantity_multiple,
                                        stocking_multiple: stocking_multiple
                                    }]
                                },
                                stocking: {
                                    bin_locations: bin_location
                                }
                            });
                        }
                    } else {
                        if (new_product_details.product_type === product_kit || new_product_details.product_type === product_membership_fee) {
                            new_product_details.item_details.push({
                                branch: vm.new_item.stores[x],
                                prices: [],
                                costs: [],
                                buying: {}
                            });
                        } else {
                            new_product_details.item_details.push({
                                branch: vm.new_item.stores[x],
                                prices: [],
                                costs: [{
                                    replacement_costs: vm.new_item.cost_amount
                                }],
                                buying: {
                                    suppliers: [{
                                        supplier: vm.new_item.supplier,
                                        id: null,
                                        replacement_cost: vm.new_item.cost_amount,
                                        supplier_uom: vm.new_item.purchase_uom,
                                        order_quantity_multiple: order_quantity_multiple,
                                        stocking_multiple: stocking_multiple
                                    }]
                                },
                                stocking: {
                                    bin_locations: bin_location
                                }
                            });
                        }
                    }
                }
            }
            product_product_service.create_record(new_product_details, util.ad_create_options(false)).then(function (data) {
                vm.product = save_current_product;
                if (vm.is_new_item_from_component_tab) {


                    vm.item_to_kitshipper.item_id = data.id;
                    vm.item_to_kitshipper.sku = data.sku;
                    vm.item_to_kitshipper.description = data.description;
                    vm.item_to_kitshipper.stocking_uom = data.stocking_uom_name;
                    vm.item_to_kitshipper.order_qty = vm.new_item_component_qty;
                    vm.item_to_kitshipper.parent_product = vm.product.id;
                    vm.item_to_kitshipper.child_variant = data.product_variants[0].id;
                    vm.item_to_kitshipper.stocking_uom_id = data.stocking_uom;
                    vm.item_to_kitshipper.product_id = data.id;
                    vm.item_to_kitshipper.serialization = data.serialization;


                    vm.item_add_kitshipper_save_button.success().then(function () {
                        if (vm.item_quick_add_dialog) {
                            vm.item_quick_add_dialog.close();
                            if (call_back && call_back instanceof Function) {
                                call_back(vm.item_to_kitshipper, true);
                            }
                        }
                    });


                } else {
                    vm.images = vm.image_maint.setImages([]);
                    vm.item = save_current_item;


                    if (add_more) {
                        vm.item_add_save_and_add_button.success();
                        if (data.product_type === product_kit || data.product_type === product_shipper
                            || data.product_type === product_firearm || data.product_type === product_fee) {
                            vm.new_item.selling_uom = vm.system_default_stocking_uom;
                            vm.new_item.purchase_uom = vm.system_default_stocking_uom;
                            vm.new_item.order_multiple = 1;
                        }

                        vm.new_item.sku = null;
                        vm.new_item.item_details = "";
                        vm.new_item.description = "";
                        vm.new_item.price_amount = null;
                        vm.new_item.cost_amount = null;
                        vm.new_item.supplier = null;
                        vm.new_item.category = 0;
                        vm.new_item.set_price = null;
                        vm.new_item.product_type = product_standard;
                        vm.new_item.price_by = 2;
                        vm.new_item.kit_price_option = null;
                        vm.new_item.kit_discount_off_retail_percent = null;
                        vm.new_item.kit_markup_from_cost_percent = null;
                        vm.new_firearm_type = null;
                        vm.new_firearm_manufacturer = null;
                        vm.new_firearm_model = null;
                        vm.new_firearm_caliber_or_gauge = null;
                        vm.new_item.is_discountable = true;
                        vm.new_item_selected_category = "Select Category";
                        vm.new_item_selected_category_id = 0;
                        vm.new_item.stores = [vm.current_active_branch];
                        vm.new_item.sell_price_type = 0;
                        vm.new_item.desired_gp_percent = null;
                        vm.focus_new_sku = true;
                        vm.new_item_category_filter = {list_type: 'hierarchical_list'};
                        vm.processing_new_item_category_search = true;
                        vm.new_item.bin_location = "";
                        vm.new_item_category_hierarchical_datasource = product_category_hierarchical_service.get_record_server_filter_hierarchical_data_source(util.ad_find_options(true, false),
                            vm.new_item_category_filter, 99999, $scope);

                        $timeout(function () {
                            var retail_price_widget = kendo.widgetInstance($('#new_price_amount'));
                            retail_price_widget.wrapper[0].childNodes[0].classList.add("ep-required-flag-invalid");
                            var cost_amount_widget = kendo.widgetInstance($('#new_cost_amount'));
                            cost_amount_widget.wrapper[0].childNodes[0].classList.add("ep-required-flag-invalid");
                            var desired_gp_widget = kendo.widgetInstance($('#new_desired_gp'));
                            desired_gp_widget.wrapper[0].childNodes[0].classList.add("ep-required-flag-invalid");
                        });
                    } else {

                        vm.item_add_save_and_edit_button.success().then(function () {
                            if (vm.item_quick_add_dialog) {
                                vm.item_quick_add_dialog.close();

                                vm.nav_service.clear_navigation(app_name, component_name);

                                if (vm.new_item.product_type === 2 || vm.new_item.product_type === 7) {
                                    _set_component_tab_default();
                                }

                                $location.path('products/productitem/edit/' + data.id);


                            }
                        });
                    }

                    unsaved_data_tracker.reset();

                }

            }, function error(reason) {
                vm.product = save_current_product;
                vm.item = save_current_item;
                if (add_more) {
                    vm.item_add_save_and_add_button.failure();
                } else {

                    if (vm.is_new_item_from_component_tab) {
                        vm.item_add_kitshipper_save_button.failure();
                    } else {
                        vm.item_add_save_and_edit_button.failure();
                    }
                }

                $timeout(function () {
                    util.handleErrorInsideDialog(reason, vm.item_quick_add_dialog);
                }, 2500);
            });
        }
    };

    const _set_component_tab_default = function () {
        const setting = {app_name: app_name, component_name: "component_tab"};
        session_storage_service.register_storage_for_app_component(setting);
        session_storage_service.insert_or_update_component_data_for_app_storage(app_name, setting.component_name, {load_component: true});
    };

    function valid_product_add() {
        var continue_add = true;

        if (vm.item_quick_add_dialog) {
            if (!vm.new_item.sku ||
                !vm.new_item.description ||
                (!vm.new_item.stores || vm.new_item.stores.length === 0) ||
                !vm.new_item_selected_category_id ||
                vm.new_item.price_by < 0 ||
                (
                    (product_types.indexOf(vm.new_item.product_type) > -1) &&
                    (!vm.new_item.supplier || !vm.new_item.purchase_uom || !vm.new_item.order_multiple)
                ) ||
                ((product_types_pricing.indexOf(vm.new_item.product_type) > -1) && !vm.new_item.selling_uom) ||
                (
                    vm.new_item.product_type === product_membership_fee &&
                    (
                        !vm.new_item.selling_uom ||
                        (vm.new_item.price_by != prompt_price_tye && !vm.new_item.price_amount)
                    )
                ) ||
                (
                    vm.new_item.product_type === product_firearm &&
                    (
                        !vm.new_firearm_type ||
                        !vm.new_firearm_manufacturer ||
                        !vm.new_firearm_model || !vm.new_firearm_caliber_or_gauge
                    )
                )
            ) {
                vm.item_quick_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                continue_add = false;
            }

            if (vm.new_item.product_type === product_shipper && vm.new_item.price_by != prompt_price_tye && !vm.new_item.cost_amount) {
                vm.item_quick_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                continue_add = false;
            }

            if (vm.new_item.product_type === product_donation &&
                (!vm.new_item_selected_category_id || vm.new_item_selected_category_id === 0)
            ) {
                vm.item_quick_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                continue_add = false;
            }

            if (continue_add &&
                (vm.new_item.product_type === product_firearm ||
                    vm.new_item.product_type === product_standard ||
                    vm.new_item.product_type === product_fee ||
                    vm.new_item.product_type === product_shipper) &&
                vm.new_item.is_active === false) {
                vm.item_quick_add_dialog.inline_error_message("Selected Supplier is not active.");
                continue_add = false;
            }

            /* if (continue_add && ( vm.new_item.product_type === product_fee) && (vm.new_item.price_amount === null ||
                     vm.new_item.cost_amount === null)) { //vm.new_item.product_type === product_standard ||
                 vm.item_quick_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                 continue_add = false;

             }*/

            if (continue_add && vm.new_item.product_type === product_kit &&
                (vm.new_item.kit_price_option === 2 && !vm.new_item.kit_markup_from_cost_percent) ||
                (vm.new_item.kit_price_option === 1 && !vm.new_item.kit_discount_off_retail_percent) ||
                (vm.new_item.kit_price_option === 0 && !vm.new_item.set_price)) {

                vm.item_quick_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                continue_add = false;

            }

            if (continue_add && vm.is_new_item_from_component_tab && !vm.new_item_component_qty) {
                vm.item_quick_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                continue_add = false;
            }

            if (continue_add && vm.new_item.product_type === product_gift_card) {
                if (vm.new_item.gift_card_type == 10 || vm.new_item.gift_card_type == 30) {
                    if (vm.new_item.price_by != prompt_price_tye && (!vm.new_item.price_amount || !vm.new_item.cost_amount)) {
                        vm.item_quick_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                        continue_add = false;
                    }
                }
                if (vm.new_item.gift_card_type != 40) {
                    if (!vm.new_item.supplier) {
                        vm.item_quick_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                        continue_add = false;
                    }
                }
            }

            if (continue_add &&
                (
                    vm.new_item.product_type === product_standard ||
                    vm.new_item.product_type === product_firearm ||
                    vm.new_item.product_type === product_fee
                )
            ) {
                if ((vm.new_item.price_by != prompt_price_tye && !vm.new_item.price_amount && !vm.new_item.cost_amount) ||
                    (vm.new_item.price_by != prompt_price_tye && !vm.new_item.price_amount && !vm.new_item.desired_gp_percent) ||
                    (vm.new_item.price_by != prompt_price_tye && !vm.new_item.cost_amount && !vm.new_item.desired_gp_percent) ||
                    (vm.new_item.price_by === prompt_price_tye && !vm.new_item.desired_gp_percent)) {
                    vm.item_quick_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                    continue_add = false;
                }
            }
            if (continue_add && vm.new_item.price_by === prompt_price_tye &&
                (
                    vm.new_item.product_type === product_kit ||
                    vm.new_item.product_type === product_shipper
                )
            ) {
                show_inline_error_kit_shipper();
                continue_add = false;
            }

        } else {
            continue_add = false;
        }
        return (continue_add);
    }

    vm.item_quick_add_cancel_response = function () {
        if (vm.item_quick_add_dialog) {
            if (vm.new_item_category.isopen) {
                vm.new_item_category.isopen = false;
            }
            vm.pre = "";
            vm.is_default_supplier_defined = false;
            vm.item_quick_add_dialog.close();
        }
        $scope.$broadcast("add_item_window_canceled");
    };

    vm.amount_field_options = {
        spinners: false,
        min: 0,
        decimals: 2,
        max: 999999999.99,
        format: "n2",
        round: false,
        restrictDecimals: true
    };

    vm.kit_field_options1 = {
        spinners: false,
        min: 0,
        decimals: 2,
        max: 999999999.99,
        format: "n2",
        round: false,
        restrictDecimals: true,
        change: function () {
            var price = null;
            if (this.value() === null)
                price = 0;
            else
                price = this.value();
            _get_components_details(vm.product.id, vm.item.branch, vm.product.kit_components, price);
            $scope.$broadcast("enable_reset");
        }
    };

    vm.kit_field_options2 = {
        spinners: false,
        round: false
    };


    vm.markup_cost_options = {
        spinners: false,
        min: 0,
        max: 999.00,
        decimals: 2,
        round: false,
        restrictDecimals: true
    };

    vm.discount_off_options = {
        spinners: false,
        min: 0,
        max: 100,
        decimals: 2,
        round: false,
        restrictDecimals: true
    };

    vm.avg_amount_field_options = {
        spinners: false,
        decimals: 4,
        max: 999999999.99,
        format: "n4",
        round: false,
        restrictDecimals: true
    };

    vm.numeric_field_options = {
        spinners: false,
        max: 999999999,
        min: 0,
        decimals: 2,
        round: false,
        restrictDecimals: true
    };

    vm.edit_product_type_clicked = function () {
        var product_type;
        product_type = vm.product.product_type.toString();
        switch (product_type) {
            case "1": //Matrix
                break;
            case "2":  //Kit
                vm.product_kit_add_clicked();
                break;
            case "3":  //BOM
                break;
            case "4": // Firearm
                break;
            case "5": // LBM
                break;
            case "6": // Fee
                break;
            default:
                StdDialog.information("Unknown product type.  Please make another selection.");
        }
    };

    vm.product_kit_add_clicked = function () {
        vm.edit_product_kit = vm.product.kit_components;
        vm.product_kit_grid_data_source.data(vm.edit_product_kit);
        vm.checked_kit_row_count = 0;
        vm.checkedIds = [];
        vm.kit_add_parent_product = 0;
        vm.kit_add_sku = "";
        vm.kit_add_description = "";
        vm.kit_add_sell_uom_name = "";
        vm.kit_add_quantity = 0;
        vm.kit_add_sell_uom = null;
        vm.kit_add_id = null;
        vm.kit_add_edit_id = null;

        vm.modal_window_size = 'lg';

        var buttons = [
            /*
             {
             text: "Cancel",
             primary: false,
             callback:vm.product_kit_cancel_response
             },
             */
            {
                text: "Done",
                primary: true,
                animated_button: vm.product_kit_save_button,
                callback: vm.product_kit_save_response
            }

        ];
        vm.product_kit_edit_dialog = StdDialog.custom({
            size: vm.modal_window_size,
            title: "Choose Products for this Kit",
            templateUrl: 'app/product/product_maintenance/views/templates/product_kit_edit.html',
            windowClass: 'ep-alert-override-modal',
            auto_close: false,
            controller_name: "product_controller",
            scope: $scope,
            icon: "",
            buttons: buttons
        });

    };

    vm.product_kit_item_select = function (e) {
        var dataItem = e.sender.dataItem(e.item.index());
        if (dataItem) {
            vm.kit_add_child_product = dataItem.id;
            vm.kit_add_sku = dataItem.sku;
            vm.kit_add_description = dataItem.description;
            vm.kit_add_product_type = dataItem.product_type;
            vm.kit_add_stocking_uom = dataItem.stocking_uom;
            //var Element = $("#kit_stocking_uom_field").data("kendoDropDownList");
            ////Element_kit_uom.value(dataItem.stocking_uom);
            //Element.value(dataItem.stocking_uom);
            //Element.trigger("select");
            e.sender.value(vm.kit_add_sku);

        }
    };

    vm.product_kit_save_response = function () {
        var valid_product_kit = true;
        if (valid_product_kit) {
            if (vm.product_kit_edit_dialog) {
                vm.product_kit_edit_dialog.close();
            }
            vm.product.kit_components = vm.edit_product_kit;
        }
    };

    vm.product_kit_cancel_response = function () {
        if (vm.product_kit_edit_dialog) {
            vm.product_kit_edit_dialog.close();
        }
    };

    function valid_kit_item() {
        var valid_record = true;

        if (vm.product_kit_edit_dialog) {
            vm.product_kit_edit_dialog.remove_inline_error_message();
            if (vm.kit_add_sku.length > 0 && vm.kit_add_quantity > 0 && (vm.kit_add_stocking_uom && vm.kit_add_stocking_uom > 0)) {
                if (vm.kit_add_sku == vm.product.sku) {
                    vm.product_kit_edit_dialog.inline_error_message("Kit item can't match parent item.");
                    valid_record = false;
                }

            } else {
                vm.product_kit_edit_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
                valid_record = false;
            }
            if (vm.kit_add_product_type && vm.kit_add_product_type > 0) {
                if (vm.kit_add_product_type == product_kit) {
                    vm.product_kit_edit_dialog.inline_error_message("Kit product can't be part of a kit.");
                    valid_record = false;
                }
            }
        } else {
            valid_record = false;
        }

        return valid_record;
    }

    vm.add_kit_item_detail = function () {
        if (valid_kit_item()) {

            if (vm.edit_product_kit == null) {
                vm.edit_product_kit = [];
            }

            if (vm.kit_add_edit_id) {
                for (var t = 0; t < vm.edit_product_kit.length; t++) {
                    if (vm.edit_product_kit[t].id == vm.kit_add_edit_id) {
                        vm.edit_product_kit[t].child_product = vm.kit_add_child_product;
                        vm.edit_product_kit[t].id = vm.kit_add_id;
                        vm.edit_product_kit[t].child_uom = vm.kit_add_stocking_uom;
                        if (!vm.kit_add_stocking_uom_name == null) {
                            vm.edit_product_kit[t].child_uom_name = vm.kit_add_stocking_uom_name;
                        }
                        vm.edit_product_kit[t].quantity = vm.kit_add_quantity;
                        vm.edit_product_kit[t].sku = vm.kit_add_sku;
                        vm.edit_product_kit[t].description = vm.kit_add_description;

                        // Unselect checkbox in grid.
                        if (vm.checked_kit_row_count == vm.edit_product_kit.length) {
                            var select_grid = $('#product_kit_detail_grid').data('kendoGrid');
                            $('.ob-selected').prop('checked', false);
                            select_grid.tbody.children('tr').removeClass('k-state-selected');
                            vm.checked_kit_row_count = 0;
                            vm.checkedIds = [];
                        }
                        break;
                    }
                }
            } else {
                if (vm.product && vm.product.id) {
                    vm.kit_add_parent_product = vm.product.id;
                } else {
                    vm.kit_add_parent_product = 0;
                }
                vm.edit_product_kit.push({
                    id: vm.kit_add_id,
                    child_product: vm.kit_add_child_product,
                    child_uom: vm.kit_add_stocking_uom,
                    child_uom_name: vm.kit_add_stocking_uom_name,
                    quantity: vm.kit_add_quantity,
                    sku: vm.kit_add_sku,
                    description: vm.kit_add_description,
                    parent_product: vm.kit_add_parent_product,

                });
                /*vm.edit_product_kit["aggregates"] = {
                        "quantity": {"sum": 3}
                    }*/
            }
            vm.product_kit_grid_data_source.data(vm.edit_product_kit);

            // Clear add fields.
            vm.kit_add_parent_product = 0;
            vm.kit_add_sku = "";
            vm.kit_add_child_product = null;
            vm.kit_add_description = "";
            vm.kit_add_stocking_uom_name = "";
            vm.kit_add_quantity = 0;
            vm.kit_add_stocking_uom = null;
            vm.kit_add_id = null;
            vm.kit_add_edit_id = null;
            vm.checkedIds = [];
            vm.checked_kit_row_count = 0;

        }
    };

    vm.delete_kit_item_detail = function () {

        for (var t = 0; t < vm.edit_product_kit.length; t++) {
            var the_id = vm.edit_product_kit[t].id;
            if (vm.checkedIds[the_id] == true) {
                vm.edit_product_kit.splice(t, 1);
            }
        }
        vm.checked_kit_row_count = 0;
        vm.checkedIds = [];
        vm.product_kit_grid_data_source.data(vm.edit_product_kit);
        vm.product_kit_edit_dialog.remove_inline_error_message();
    };

    vm.kit_stocking_uom_selected = function (event) {
        vm.kit_add_stocking_uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
    };

    vm.show_kit_delete_icon = function () {
        return (vm.edit_product_kit.length > 0 && vm.checked_kit_row_count > 0);
    };

    vm.show_kit_edit_icon = function () {
        return (vm.edit_product_kit.length > 0 && vm.checked_kit_row_count > 0);
    };

    vm.edit_kit_detail = function () {
        vm.product_kit_edit_dialog.remove_inline_error_message();
        if (vm.checked_kit_row_count > 1) {
            vm.product_kit_edit_dialog.inline_error_message("Select only one record to edit.");
        } else {
            for (var t = 0; t < vm.edit_product_kit.length; t++) {
                if (vm.checkedIds[vm.edit_product_kit[t].id] == true) {
                    vm.kit_add_id = vm.edit_product_kit[t].id;
                    vm.kit_add_parent_product = vm.edit_product_kit[t].parent_product;
                    vm.kit_add_sku = vm.edit_product_kit[t].sku;
                    vm.kit_add_description = vm.edit_product_kit[t].description;
                    vm.kit_add_sell_uom_name = null;
                    vm.kit_add_quantity = vm.edit_product_kit[t].quantity;
                    vm.kit_add_sell_uom = vm.edit_product_kit[t].child_uom;
                    vm.kit_add_edit_id = vm.edit_product_kit[t].id;
                    vm.kit_add_child_product = vm.edit_product_kit[t].child_product;
                    var init_value = [];
                    init_value.push(vm.edit_product_kit[t].child_product);
                    var select_kit_search = $('#product_kit_search').data('kendoAutoComplete');
                    select_kit_search.dataSource.data(init_value);
                    select_kit_search.value(vm.kit_add_sku);
                }
            }
            vm.checked_kit_row_count = 0;
            vm.checkedIds = [];
        }
    };

    $scope.kit_detail_checked = function (e, dataItem) {
        var element = $(e.currentTarget);

        var checked = element.is(':checked');
        var row = $(e.currentTarget).closest("tr");
        vm.checkedIds[dataItem.id] = checked;
        if (checked) {
            vm.checked_kit_row_count += 1;
            row.addClass("k-state-selected");
        } else {
            if (vm.checked_kit_row_count > 0) {
                vm.checked_kit_row_count -= 1;
            }
            row.removeClass("k-state-selected");
        }

    };

    $scope.kit_detail_select_all = function (e) {
        // e.currentTarget.blur();
        var select_grid = $('#product_kit_detail_grid').data('kendoGrid');

        if (vm.checked_kit_row_count == vm.edit_product_kit.length) {
            $('.ob-selected').prop('checked', false);
            select_grid.tbody.children('tr').removeClass('k-state-selected');
            vm.checked_kit_row_count = 0;
            vm.checkedIds = [];
        } else {

            $('.ob-selected').prop('checked', true);
            select_grid.tbody.children('tr').addClass('k-state-selected');
            vm.checked_kit_row_count = vm.edit_product_kit.length;
            for (var t = 0; t < vm.checked_kit_row_count; t++) {
                vm.checkedIds[vm.edit_product_kit[t].id] = true;
            }
        }
    };

    vm.product_upc_add = function () {

        if (vm.edit_product_upcs == null) {
            vm.edit_product_upcs = [];
        }
        var new_upc = {};
        new_upc["is_primary"] = false;
        if (vm.product.product_attributes && vm.product.product_attributes.length > 0) {
            var i = 0;
            angular.forEach(vm.product.product_attributes, function (product_attribute) {
                if (i == 0) {
                    new_upc["product_attribute_value_1"] = product_attribute.attribute_name;
                    i += 1;
                } else if (i == 1) {
                    new_upc["product_attribute_value_2"] = product_attribute.attribute_name;
                    i += 1;
                } else if (i == 3) {
                    new_upc["product_attribute_value_3"] = product_attribute.attribute_name;
                    i += 1;
                }
            });
        } else {
            new_upc["product_attribute_value_1"] = null;
            new_upc["product_attribute_value_2"] = null;
            new_upc["product_attribute_value_3"] = null;
        }
        vm.edit_product_upcs.push(new_upc);
    };

    vm.edit_product_upc_clicked = function () {
        if (vm.add_mode == false) {
            if (vm.product.product_type == 1) {
                vm.dialog_window_size = 'lg';
            } else {
                vm.dialog_window_size = 'md';
            }

            vm.edit_product_upcs_temp = angular.copy(vm.edit_product_upcs || {});
            if (vm.edit_product_upcs_temp.length == 0) {
                vm.new_upc_text = {
                    is_primary: true,
                    uom: "",
                    uom_name: "",
                    alternate_code: undefined
                };
                vm.show_add_new_upc_btn = true;
            } else {
                vm.show_add_new_upc_btn = false;
            }
            var buttons = [
                {
                    text: "Cancel",
                    primary: false,
                    callback: vm.product_upc_cancel_response
                },
                {
                    text: "Ok",
                    primary: true,
                    callback: vm.product_upc_save_response
                }

            ];
            vm.product_upc_dialog = StdDialog.custom({
                size: vm.dialog_window_size,
                title: "Enter UPC Values",
                templateUrl: 'app/product/product_maintenance/views/templates/product_upc_edit.html',
                windowClass: 'ep-alert-override-modal',
                auto_close: false,
                controller_name: "product_controller",
                scope: $scope,
                icon: "mdi mdi-cube-outline",
                buttons: buttons,
                is_keyboard_support_required: true,
                back_action: vm.product_upc_cancel_response,
                rendered_callback: 'upc_dialog_rendered'
            });


        }
        ;

    };

    vm.upc_dialog_rendered = function () {
        if (vm.show_add_new_upc_btn) {
            vm.focus_new_upc = true;
        } else {
            vm.focus_old_upc = true;
        }
    }


    vm.on_adding_new_upc = function (new_upc) {
        vm.upc_added = true;
        vm.new_upc_text = {};
        vm.edit_product_upcs_temp.push(new_upc);
        vm.new_upc_text.is_primary = !is_primary_upc_exists(vm.edit_product_upcs_temp);
        vm.new_upc_text.uom = "";
        vm.new_upc_text.uom_name = "",
            vm.new_upc_text.alternate_code = undefined;
        vm.show_add_new_upc_btn = true;
        $timeout(function () {
            vm.focus_new_alternate_code = true;
        });
    };

    vm.remove_upc = function (new_upc, index) {
        $timeout(function () {
            var show = null;
            if (new_upc === 'new') {
                if (vm.edit_product_upcs_temp.length > 0) {
                    show = false;
                } else {
                    vm.new_upc_text.is_primary = true;
                }
                vm.new_upc_text.uom = "";
                vm.new_upc_text.alternate_code = undefined;
                vm.new_upc_text.uom_name = "";
            } else {
                if (new_upc && new_upc.length > 0) {
                    new_upc.splice(index, 1);
                }
                if (!show && new_upc && new_upc.length === 0) {
                    vm.new_upc_text = {};
                    vm.new_upc_text.is_primary = true;
                    vm.new_upc_text.uom = "";
                    vm.new_upc_text.uom_name = "",
                        vm.new_upc_text.alternate_code = undefined;
                    /*new_upc.is_primary = true;
                    new_upc.uom = "";
                    new_upc.alternate_code = undefined;
                    new_upc.uom_name= "";*/
                    show = true;
                    vm.edit_product_upcs_temp = [];
                }
            }

            vm.show_add_new_upc_btn = show != null ? show : vm.show_add_new_upc_btn;
        });
    };

    vm.add_new_upc = function () {
        vm.show_add_new_upc_btn = true;
        vm.upc_added = true;

        vm.new_upc_text = {
            is_primary: !is_primary_upc_exists(vm.edit_product_upcs_temp),
            uom: "",
            uom_name: "",
            alternate_code: undefined
        };

    };

    /**
     * _open_product_label_print_dialog
     * @private
     */
    const _open_product_label_print_dialog = function () {
        const _caller_data = {
            subsystem_data: {"item": vm.subsystem_data},
            subsystem_name: "Inventory"
        };

        let label_print_dialog = StdDialog.custom({
            controller_name: 'label_print_dialog_controller',
            create_controller_and_scope: true,
            configure_from_new_controller: true,
            scope: $scope,
            caller_data: _caller_data
        });
    };

    /**
     * _open_adjust_value
     * @private
     */
    const _open_adjust_value = function () {

        if (unsaved_data_tracker.changes_detected()) {
            StdDialog.information('You have unsaved changes which are about to be lost. ' +
                'Please save your changes before proceeding.');
        } else {
            var enable_cost_update = false;
            var modal_title = '';
            var buttons;
            if (vm.item.costs.keep_running_cost) {
                enable_cost_update = true;
            }

            if (enable_cost_update) {
                modal_title = 'Adjust Value';
                vm.caller_data = {
                    product_sku: vm.product.sku,
                    product_description: vm.product.description,
                    branch: vm.item.branch,
                    product: vm.product.id,
                    running_cost: vm.item.costs.running_cost,
                    enable_cost_update: enable_cost_update
                };

                vm.new_running_value_options = {
                    format: "n2",
                    decimals: 2,
                    min: 0,
                    max: 999999999.99,
                    spinners: false,
                    round: false,
                    restrictDecimals: true
                };

                vm.shrinkage_codes_dropdown_options = {};
                vm.shrinkage_data_source = shrinkage_reasons_service.get_record_server_filter_data_source(util.ad_find_options(true, false),
                    shrinkage_reasons_service.filter_none(), 99999, $scope);

                shrinkage_reasons_service.get_default_shrinkage_reason({is_default: true}).then(function (data) {
                    if (data && data.length) {
                        vm.adjust_inventory.selected_shrinkage = data[0].id;
                    }
                });

                vm.adjust_inventory.new_running_total_value = undefined;

                buttons = [
                    {
                        text: "Cancel",
                        primary: false,
                        callback: vm.adjust_value_cancel_response
                    },
                    {
                        text: "Save",
                        animated_button: vm.item_adjust_inventory_save_button,
                        primary: true,
                        callback: vm.adjust_value_save_response,
                        disable_if: "product_controller.adjust_inventory.new_running_total_value ===undefined ||  product_controller.adjust_inventory.new_running_total_value < 0 || !product_controller.adjust_inventory.selected_shrinkage"
                    }
                ];
            } else {
                vm.caller_data = {
                    enable_cost_update: enable_cost_update
                };
                modal_title = 'Adjust Quantity';
                buttons = [
                    {
                        text: "Ok",
                        primary: true,
                        callback: vm.adjust_value_cancel_response
                    }

                ];
            }

            vm.adjust_value_dialog = StdDialog.custom({
                title: modal_title,
                templateUrl: 'app/product/product_maintenance/views/templates/adjust_value.html',
                windowClass: 'ep-alert-override-modal',
                auto_close: false,
                controller_name: "product_controller",
                scope: $scope,
                size: 'md',
                icon: "mdi mdi-counter",
                buttons: buttons,
                is_keyboard_support_required: true,
                caller_data: vm.caller_data,
                back_action: vm.adjust_value_cancel_response
            });
        }
    };


    vm.adjust_value_cancel_response = function () {
        if (vm.adjust_value_dialog) {
            vm.adjust_value_dialog.close();
        }
    };

    vm.adjust_value_save_response = function () {
        vm.item_adjust_inventory_save_button.start();

        const payload = {
            branch_id: vm.caller_data.branch,
            adjustment_reason_id: vm.adjust_inventory.selected_shrinkage,
            new_inventory_value: vm.adjust_inventory.new_running_total_value,
            comment: angular.isUndefined(vm.adjust_inventory.note) || vm.adjust_inventory.note === '' ? undefined : vm.adjust_inventory.note,
            lot_type: default_lot_type
        };

        product_product_service.update_average_cost(vm.caller_data.product, payload).then(function (result) {
            vm.item_adjust_inventory_save_button.success_no_delay().then(function () {
                if (vm.adjust_value_dialog) {
                    vm.item.costs.running_cost = vm.adjust_inventory.new_running_total_value;
                    vm.adjust_value_dialog.close();
                }
            });
        }, function (err) {
            util.handleErrorWithWindow(err);
        });
    }


    vm.print_labels = function () {
        if (vm.product_actions_panel) {
            vm.product_actions_panel.close();
        }
        if (vm.item.id) {
            vm.subsystem_data = [];
            vm.subsystem_data.push(vm.item.id);
            //vm.openProductLabelPrintWindow = true;
            _open_product_label_print_dialog();
        }
    };

    vm.adjust_inventory = function () {
        if (vm.product_actions_panel) {
            vm.product_actions_panel.close();
        }

        _open_adjust_value();
    };

    var adding_upc = function (upc) {
        /*if (vm.edit_product_upcs_temp && vm.edit_product_upcs_temp.length > 0) {
            upc = vm.edit_product_upcs_temp;
            && vm.new_upc_text['uom_name'] !== "" && angular.isDefined(vm.new_upc_text['uom'])
        }*/
        vm.upc_added = true;
        if (vm.new_upc_text && angular.isDefined(vm.new_upc_text['alternate_code']) && vm.new_upc_text.alternate_code != null) {
            /* if(!upc){
                 upc = [];
             }*/
            vm.edit_product_upcs_temp.push(vm.new_upc_text);
            delete vm.new_upc_text;
        }

    };

    vm.product_upc_save_response = function () {

        var valid_product_upc = true;

        adding_upc(vm.edit_product_upcs_temp);
        valid_product_upc = vm.check_product_upcs_validity(vm.edit_product_upcs_temp);
        vm.show_add_new_upc_btn = false;
        if (valid_product_upc) {
            vm.edit_product_upcs = angular.copy(vm.edit_product_upcs_temp);
            vm.new_upc_text = {};
            vm.new_upc_text.is_primary = false;
            vm.new_upc_text.uom = "";
            vm.new_upc_text.uom_name = "",
                vm.new_upc_text.alternate_code = undefined;
            if (vm.product_upc_dialog) {
                vm.product_upc_dialog.close();
            }

            angular.forEach(vm.product.product_variants, function (product_variants) {
                // Delete all the UPCs
                product_variants.alternate_codes = [];
            });

            // Now add back in the real UPCS.
            angular.forEach(vm.edit_product_upcs, function (product_upc) {
                if (vm.product.product_variants.length == 1) {
                    vm.product.product_variants[0].alternate_codes.push({
                        'alternate_code': product_upc.alternate_code,
                        'uom': product_upc.uom,
                        'is_primary': product_upc.is_primary,
                        'id': product_upc.id
                    });
                } else {
                    // Loop through the variants to add the matching UPCS
                    for (var x = 0; x < vm.product.product_variants.length; x++) {
                        if (vm.product.product_variants[x].product_attribute_value_1 == product_upc.attribute_value_1 &&
                            vm.product.product_variants[x].product_attribute_value_2 == product_upc.attribute_value_2 &&
                            vm.product.product_variants[x].product_attribute_value_3 == product_upc.attribute_value_3) {
                            vm.product.product_variants[x].alternate_codes.push({
                                'alternate_code': product_upc.alternate_code,
                                'uom': product_upc.uom,
                                'is_primary': product_upc.is_primary,
                                'id': product_upc.id
                            });
                        }
                    }
                }
            });
            count_product_upcs();
        }
    };

    vm.product_upc_cancel_response = function () {
        vm.upc_added = false;

        if (vm.product_upc_dialog) {
            vm.product_upc_dialog.close();
        }
    };

    vm.upc_uom_selected = function (event, change_index) {
        var uom_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        if (change_index === "new") {
            vm.new_upc_text.uom_name = uom_name;
        } else {
            vm.edit_product_upcs_temp[change_index].uom_name = uom_name;
        }

    };

    vm.is_primary_upc_clicked = function (new_upc, upc_list, chk_index) {
        if (chk_index == 'new' && new_upc.is_primary == true) {
            for (var zz = 0; zz < upc_list.length; zz++) {
                upc_list[zz].is_primary = false;
            }
        } else if (upc_list[chk_index] && true == upc_list[chk_index].is_primary) {
            for (var z = 0; z < upc_list.length; z++) {
                if (z != chk_index) {
                    upc_list[z].is_primary = false;
                }
            }
            if (new_upc && new_upc.is_primary) {
                new_upc.is_primary = false;
            }
        }
    };

    var is_primary_upc_exists = function (object_array, return_object_flag) {
        if (object_array && object_array instanceof Array) {
            for (var i = 0; i < object_array.length; i++) {
                var object = object_array[i];
                if (util.is_exists(object, "is_primary") && object.alternate_code != '' && object.uom != '') {
                    if (return_object_flag) {
                        return object;
                    }
                    return true;
                }
            }
            return false;
        }
        return false;
    };

    vm.check_product_upcs_validity = function (passed_product_upcs) {
        var valid = true;
        var required_satisfied = true;
        var error_message = "";
        var is_primary_count = 0;
        var distinct = [];
        var upc_record = "";
        var duplicate_upc = false;
        if (passed_product_upcs && passed_product_upcs.length >= 1) {
            angular.forEach(passed_product_upcs, function (product_upc) {
                if (product_upc.is_primary) {
                    is_primary_count += 1;
                }
                if (product_upc.uom === null || product_upc.alternate_code == "" || product_upc.uom == "" || angular.isUndefined(product_upc.alternate_code)) {
                    required_satisfied = false;
                }
                if (product_upc.uom !== null && product_upc.alternate_code !== null && angular.isDefined(product_upc.alternate_code))
                    upc_record = {uom: product_upc.uom.toString(), code: product_upc.alternate_code.toString()};
                if (distinct.length > 0) {
                    angular.forEach(distinct, function (upc_rec) {
                        if (upc_rec.uom == product_upc.uom.toString() && upc_rec.code == product_upc.alternate_code.toString()) {
                            duplicate_upc = true;
                        } else {
                            distinct.push(upc_record);
                        }
                    });
                } else {
                    distinct.push(upc_record);
                }
            });

            if (!required_satisfied) {
                //error_message += "<p>Please make sure required fields for all Product UPCs are provided.</p>";
                valid = false;
                vm.product_upc_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
            }


            if (is_primary_count > 1) {
                error_message += "<p>Only one Product UPC can be the primary UPC.</p>";
                valid = false;
            }
            if (is_primary_count == 0) {
                error_message += "<p>Atleast one Product UPC must be marked as Primary.</p>";
                valid = false;
                vm.show_add_new_upc_btn = false;
            }
            if (duplicate_upc) {
                error_message += "<p>Duplicate UPC record found.</p>";
                valid = false;
            }

            if (error_message && vm.product_upc_dialog) {
                vm.product_upc_dialog.inline_error_message(error_message);

            }
        }

        return valid;
    };


    vm.upc_attribute_value_selected = function (event, change_index, attribute_value_number) {
        var upc_attribute_name = event.sender.dataItem(event.item)[event.sender.options.dataTextField];
        if (attribute_value_number == 1) {
            vm.edit_product_upcs[change_index].attribute_value_1_name = upc_attribute_name;
        }
        if (attribute_value_number == 2) {
            vm.edit_product_upcs[change_index].attribute_value_2_name = upc_attribute_name;
        }
        if (attribute_value_number == 3) {
            vm.edit_product_upcs[change_index].attribute_value_3_name = upc_attribute_name;
        }

    };

    vm.firearm_type_selected = function (e) {
        /*if(!e || !e.item)
        return;*/

        var dataItemType = e.sender.dataItem(e.item).name;
        var manufacturer_field = $("#firearm_manufacturer").data("kendoComboBox");
        var model_field = $("#firearm_model").data("kendoComboBox");
        var caliber_field = $("#firearm_caliber").data("kendoComboBox");

        if (vm[vm.pre + "firearm_type"] != dataItemType || !vm.firearm_initialized) {
            vm[vm.pre + "firearm_type"] = dataItemType;
            //vm.firearm_manufacturer_orignal = "";
            //vm.firearm_model_original = "";
            //vm.firearm_caliber_or_gauge_original = "";
            vm[vm.pre + "firearm_manufacturer"] = "";
            vm.firearm_manufacturers_data = [];

            manufacturer_field.setDataSource(vm.firearm_manufacturers_data);
            //vm.firearm_manufacturer_override = "";
            vm[vm.pre + "firearm_model"] = "";
            vm.firearm_models_data = [];
            model_field.setDataSource(vm.firearm_models_data);
            //vm.firearm_model_override = "";
            vm[vm.pre + "firearm_caliber_or_gauge"] = "";
            vm.firearm_caliber_or_gauges_data = [];
            caliber_field.setDataSource(vm.firearm_caliber_or_gauges_data);
            //vm.firearm_caliber_override = "";
            //vm.firearm_record = {};

            if (dataItemType) {
                $timeout(function () {
                    vm.firearm_manufacturers_data = brand_names_filter_service.get_record_data_source_ascending(util.ad_find_options(true, false), brand_names_filter_service.filter_type(dataItemType), 99999, $scope);
                    manufacturer_field.setDataSource(vm.firearm_manufacturers_data);
                });
            }
        }

    };

    vm.firearm_manufacturer_selected = function (elem) {
        var manufacturer_field = $("#firearm_manufacturer").data("kendoComboBox");
        var dataItem = manufacturer_field.dataItem();
        var model_field = $("#firearm_model").data("kendoComboBox");
        var caliber_field = $("#firearm_caliber").data("kendoComboBox");

        if (dataItem) {
            if (vm.last_brand_id != dataItem.brand_id) {
                vm[vm.pre + "firearm_manufacturer"] = dataItem.brand_name;
                vm.last_brand_id = dataItem.brand_id;
                vm.firearm_manufacturer_text = dataItem.brand_name;
                //vm.firearm_manufacturer_orignal = dataItem.brand_name;
                //vm.firearm_model_original = "";
                //vm.firearm_caliber_or_gauge_original = "";
                vm[vm.pre + "firearm_model"] = "";
                vm.firearm_models_data = [];
                model_field.setDataSource(vm.firearm_models_data);
                //vm.firearm_model_override = "";
                vm[vm.pre + "firearm_caliber_or_gauge"] = "";
                vm.firearm_caliber_or_gauges_data = [];
                caliber_field.setDataSource(vm.firearm_caliber_or_gauges_data);
                //vm.firearm_caliber_override = "";
                //vm.firearm_record = {};
                if (dataItem.brand_id) {
                    $timeout(function () {
                        vm.firearm_models_data = model_names_filter_service.get_record_data_source_ascending(util.ad_find_options(true, false), model_names_filter_service.filter_type_manufacturer(vm[vm.pre + "firearm_type"], dataItem.brand_id), 99999, $scope);
                        model_field.setDataSource(vm.firearm_models_data);
                    });
                }
            }
        } else {
            var widget = elem.sender;
            if (widget.value() && widget.select() === -1) {
                widget.value(""); //reset widget
            }
            //vm.firearm_manufacturer = manufacturer_field.text();
        }
    };

    vm.firearm_model_selected = function (elem) {
        var model_field = $("#firearm_model").data("kendoComboBox");
        var dataItem = model_field.dataItem();
        var caliber_field = $("#firearm_caliber").data("kendoComboBox");
        if (dataItem) {
            if (vm.last_model_id != dataItem.model_id) {
                vm[vm.pre + "firearm_model"] = dataItem.model_name;
                vm.last_model_id = dataItem.model_id;
                //vm.firearm_model_original = dataItem.model_name;
                //vm.firearm_caliber_or_gauge_original = "";
                vm[vm.pre + "firearm_caliber_or_gauge"] = "";
                vm.firearm_caliber_or_gauges_data = [];
                caliber_field.setDataSource(vm.firearm_caliber_or_gauges_data);
                //vm.firearm_caliber_override = "";
                //vm.firearm_record = {};
                if (dataItem.model_id) {
                    $timeout(function () {
                        vm.firearm_caliber_or_gauges_data = calibers_filter_service.get_record_data_source_ascending(util.ad_find_options(true, false), calibers_filter_service.filter_type_manufacturer_model(vm[vm.pre + "firearm_type"], vm.last_brand_id, dataItem.model_id), 99999, $scope);
                        caliber_field.setDataSource(vm.firearm_caliber_or_gauges_data);
                    });
                }
            }
        } else {
            var widget = elem.sender;
            if (widget.value() && widget.select() === -1) {
                widget.value(""); //reset widget
            }
            // vm.firearm_model = model_field.text();
        }
    };

    vm.firearm_caliber_selected = function (elem) {
        var caliber_field = $("#firearm_caliber").data("kendoComboBox");
        var dataItem = caliber_field.dataItem();
        if (dataItem) {
            vm.firearm_caliber_text = dataItem.caliber_or_gauge;
            //vm.firearm_caliber_or_gauge_original = dataItem.caliber_or_gauge;
            vm[vm.pre + "firearm_caliber_or_gauge"] = dataItem.caliber_or_gauge;
            //if (dataItem) {
            //    $timeout(function(){
            //
            //        first_firearm_service.get_records(util.ad_find_options(true, false), first_firearm_service.filter_type_manufacturer_model_caliber(vm.firearm.type, vm.last_brand_id, vm.last_model_id, dataItem.caliber_or_gauge), 99999, $scope).then(
            //            function (data) {
            //                vm.firearm_record = data;
            //            });
            //    });
            //}
        } else {
            var widget = elem.sender;
            if (widget.value() && widget.select() === -1) {
                widget.value(""); //reset widget
            }
            // vm.firearm_caliber_or_gauge = caliber_field.text();
        }
    };


    function set_product_array() {
        vm.product_id_list = inventory_grid_service.get_state_data('selected_products');
        if (vm.product_id_list && vm.product_id_list.length > 0) {
            vm.current_item_index = 1;
            vm.max_item_index = vm.product_id_list.length;
            $scope.editing_multiple_items = true;
            vm.active_branch = vm.product_id_list[0].branch;
        } else {
            vm.product_id_list = null;
            vm.current_item_index = 0;
            vm.max_item_index = 0;
            $scope.editing_multiple_items = false;
        }
    }

    function clear_product_list() {
        inventory_grid_service.delete_state_data('selected_products');
        inventory_grid_service.delete_state_data('products_filter');
        vm.product_id_list = null;
        vm.current_item_index = 0;
        vm.max_item_index = 0;
        $scope.editing_multiple_items = false;
    }

    $scope["toogods_callback_read_success_" + brand_names_filter_service.get_data_source_name()] = function (data_source, data) {
        if (!vm.firearm_initialized) {

            $timeout(function () {
                var found = false;

                var Element = $("#firearm_manufacturer").data("kendoComboBox");
                var Element_model = $("#firearm_model").data("kendoComboBox");
                var Element_caliber = $("#firearm_caliber").data("kendoComboBox");

                //angular.forEach(vm.firearm_manufacturers_data.data(), function(manufacturer){
                angular.forEach(data, function (manufacturer) {
                    if (manufacturer.brand_name === vm.product.firearm_manufacturer) {
                        //Element.value(manufacturer.brand_id);
                        Element.value(manufacturer.brand_name);
                        Element.trigger("change");
                        found = true;
                    }
                });
                if (!found) {
                    Element.text(vm.product.firearm_manufacturer);
                    vm.firearm_manufacturer = vm.product.firearm_manufacturer;
                    Element_model.text(vm.product.firearm_model);
                    vm.firearm_model = vm.product.firearm_model;
                    Element_caliber.text(vm.product.firearm_caliber_or_gauge);
                    vm.firearm_caliber_or_gauge = vm.product.firearm_caliber_or_gauge;
                    vm.firearm_initialized = true;
                    vm.loading_firearm = false;

                }
            });
        }
    };
    $scope["toogods_callback_read_success_" + model_names_filter_service.get_data_source_name()] = function (data_source, data) {
        if (!vm.firearm_initialized) {

            $timeout(function () {
                var found = false;
                var Element_model = $("#firearm_model").data("kendoComboBox");
                var Element_caliber = $("#firearm_caliber").data("kendoComboBox");
                //angular.forEach(vm.firearm_models_data.data(), function(model){
                angular.forEach(data, function (model) {
                    if (model.model_name === vm.product.firearm_model) {
                        //Element_model.value(model.model_id);
                        Element_model.value(model.model_name);
                        Element_model.trigger("change");
                        found = true;
                    }
                });
                if (!found) {
                    Element_model.text(vm.product.firearm_model);
                    vm.firearm_model = vm.product.firearm_model;
                    Element_caliber.text(vm.product.firearm_caliber_or_gauge);
                    vm.firearm_caliber_or_gauge = vm.product.firearm_caliber_or_gauge;
                    vm.firearm_initialized = true;
                    vm.loading_firearm = false;
                }
            });
        }
    };

    $scope["toogods_callback_read_success_" + calibers_filter_service.get_data_source_name()] = function (data_source, data) {
        if (!vm.firearm_initialized) {

            $timeout(function () {
                var found = false;
                var Element_caliber = $("#firearm_caliber").data("kendoComboBox");
                //angular.forEach(vm.firearm_caliber_or_gauges_data.data(), function(caliber){
                angular.forEach(data, function (caliber) {
                    if (caliber.caliber_or_gauge === vm.product.firearm_caliber_or_gauge) {
                        Element_caliber.value(caliber.caliber_or_gauge);
                        Element_caliber.trigger("change");
                        found = true;
                        vm.firearm_initialized = true;
                        vm.loading_firearm = false;
                    }
                });
                if (!found) {
                    Element_caliber.text(vm.product.firearm_caliber_or_gauge);
                    vm.firearm_caliber_or_gauge = vm.product.firearm_caliber_or_gauge;
                    vm.firearm_initialized = true;
                    vm.loading_firearm = false;
                }
            }, 3000);

        }
    };

    $scope["toogods_callback_read_success_" + product_category_hierarchical_service.get_base_url()] = function (data_source, data) {

        vm.new_item_category_highlighted = false;

        if (vm.processing_new_item_category_search == true) {

            vm.processing_new_item_category_search = false;
            vm.new_item_category_search_results_shown = true;

            $timeout(function () {
                vm.highlight_tree_search_results('new_item_category_tree_view', vm.new_item_category_search);
            });
        } else if (!vm.new_item_category_search_results_shown) {
            vm.full_tree_data = data;
        }

        vm.category_highlighted = false;

        if (vm.processing_category_search == true) {

            vm.processing_category_search = false;
            vm.category_search_results_shown = true;

            $timeout(function () {
                vm.highlight_tree_search_results('category_tree_view', vm.category_search);
            });
        } else if (!vm.category_search_results_shown) {
            vm.full_tree_data = data;
        }
    };

    // Product History export to excel
    vm.history_export_to_excel = function () {

        //vm.search_button.start();

        var export_columns = util.get_export_grid_columns_defintion($("#item_history_grid").data("kendoGrid"));
        var export_parameters = util.get_export_grid_parameters($("#item_history_grid").data("kendoGrid"),
            vm.history_filter_parameters);

        ep_export_service.export_to_excel(export_columns, export_parameters, "/api/archive/product_history/export_data/")
            .success(function (data, status, headers) {
                var filename = util.extract_export_filename(headers);
                util.export_grid_data(data, filename);
            }).error(function (reason) {
            //vm.search_button.failure();
            util.handleErrorWithWindow(reason);
        });
    };

    // Product History export to excel
    vm.history_excel_button_disabled = function () {

        if (vm.item_history_grid_data_source) {
            var grid_data = vm.item_history_grid_data_source.data();
            return grid_data.length < 1;
        } else {
            return true;
        }
    };

    const _get_product_details = function () {
        return {
            "product_details": vm.product,
            "current_selected_item_details": vm.item,
            "current_item_branch": vm.current_item_branch,
            "component_data": vm.component_details_data,
            "selling_price": vm.selling_price
        };
    };


    vm.parent_details = function () {
        return {
            "kit_print_data_option": vm.kit_print_data_option,
            "add_mode": vm.add_mode,
            "save_toolbar_button": vm.save_toolbar_button,
            "product_data_loaded": vm.product_data_loaded,
            "get_product_details": _get_product_details,
            "get_components": _get_components,
            "retrive_components_details": _get_components_details,
            "set_parent_properties_from_component": _set_product_properties,
            "fill_product_record": vm.fill_product_record,
            "price_by_selected": vm.product_price_by_selected,
            "all_permission_access_list": vm.all_inventory_access_obj
        };
    };

    const _get_product_object = function () {
        return {
            product_details: vm.product
        };
    };

    vm.product_note_details = function () {
        return {
            "add_mode": vm.add_mode,
            "save_toolbar_button": vm.save_toolbar_button,
            "product_data_loaded": vm.product_data_loaded,
            "get_product_details": _get_product_object
        };
    };

    /*vm.disable_on_save = function () {
        if(vm.is_new_item_from_component_tab){
            return vm.item_add_kitshipper_save_button.submitting
        }else {
            return (vm.item_add_save_and_edit_button.submitting || vm.item_add_save_and_add_button.submitting)
        }
    };*/

    vm.show_itr_quantity_change_log = function () {
        if (vm.item.stocking.track_inventory) {
            let _caller_data = {
                product_name: vm.product.sku,
                product_desc: vm.product.description,
                branch_list: vm.item_branch_list,
                item_branch: vm.item.branch,
                product_id: vm.product.id,
                stocking_uom: vm.product.stocking_uom_name
            };
            vm.ITR_change_log_dialog = StdDialog.custom({
                controller_name: 'itr_change_log_controller',
                scope: $scope,
                create_controller_and_scope: true,
                configure_from_new_controller: true,
                is_keyboard_support_required: true,
                caller_data: _caller_data
            });
        }
    }
    $scope.$on("set_supplier_cost", function (event, result) {
        vm.item.buying.suppliers[0].replacement_cost = result;
        vm.set_suppliers();
    });


    $scope.$on("update_product_item_details", function (event, result) {
        vm.product.item_details = result;
    });


    //This function return object containig properties which can be editable from the UI screens in Product maintanance
    vm.get_edited_properties_for_unsaved_data = function () {

        var orderBy = $filter('orderBy');
        var alternate_selling_price;

        var obj_Edited_prod = {};
        var kit_components_quantity = [];
        var alternate_codes = [];
        var alternate_code = {};
        var product_prices = {};
        var prod_prices = [];

        //General Tab
        obj_Edited_prod.sku = vm.product.sku;
        obj_Edited_prod.description = vm.product.description;
        obj_Edited_prod.category_name = vm.product.category_name;
        obj_Edited_prod.is_discontinued = vm.product.is_discontinued;
        obj_Edited_prod.manufacturer_sku = vm.product.manufacturer_sku;
        obj_Edited_prod.extended_description = vm.product.extended_description;
        obj_Edited_prod.product_notes = vm.product.product_notes;
        obj_Edited_prod.product_ranking = vm.product.ranking;

        //Price & Cost Tab
        // In case of not having price and cost permission, dont track the price & cost details
        if (vm.all_inventory_access_obj.access_price_cost) {
            obj_Edited_prod.desired_gp_percent = ep_percentageFilter(vm.product.desired_gp_percent);
            obj_Edited_prod.price_by = vm.product.price_by;
        }

        //For Components Tab,P&C tab in Kits
        if (vm.product.product_type === product_kit) {
            obj_Edited_prod.kit_print_option = vm.product.kit_print_option;
            if (vm.all_inventory_access_obj.access_price_cost) {
                obj_Edited_prod.kit_price_option = vm.product.kit_price_option;
                obj_Edited_prod.kit_markup_from_cost_percent = parseFloat(vm.product.kit_markup_from_cost_percent) || 0;
                obj_Edited_prod.kit_discount_off_retail_percent = parseFloat(vm.product.kit_discount_off_retail_percent) || 0;
            }
        }

        //For component tab in Shipper
        if (vm.product.product_type === product_shipper) {
            obj_Edited_prod.shipper_update_cmp_qnty = vm.product.kit_update_component_quantity_on_order;
        }

        //Unit of measure -General Tab
        obj_Edited_prod.product_stocking_uom = vm.product.stocking_uom;
        obj_Edited_prod.product_selling_uom = vm.product.default_selling_uom;
        obj_Edited_prod.product_purchasing_uom = vm.product.default_purchasing_uom;
        obj_Edited_prod.product_selling_uom_multiple = parseFloat(vm.product.default_selling_multiple) || 0;
        obj_Edited_prod.uom_order_multiple = parseFloat(vm.product.default_purchasing_multiple) || 0;

        //Specification -General Tab
        obj_Edited_prod.height = vm.product.height;
        obj_Edited_prod.height_unit = vm.product.height_unit;
        obj_Edited_prod.width = vm.product.width;
        obj_Edited_prod.width_unit = vm.product.width_unit;
        obj_Edited_prod.length = vm.product.length;
        obj_Edited_prod.length_unit = vm.product.length_unit;
        obj_Edited_prod.cube = vm.product.cube;
        obj_Edited_prod.cubic_unit = vm.product.cubic_unit;
        obj_Edited_prod.weight = vm.product.weight;
        obj_Edited_prod.weight_unit = vm.product.weight_unit;

        //Consumer Brand -General Tab
        obj_Edited_prod.consumer_brand_name = vm.product.consumer_brand_name;
        obj_Edited_prod.brand_comparison_uom = vm.product.brand_comparison_uom;
        obj_Edited_prod.brand_comparison_conversion_factor = vm.product.brand_comparison_conversion_factor;

        obj_Edited_prod.item_details = [];

        if (vm.product.item_details.length > 0) {

            var stores, suppliers, supplier, current_supplier, stock_sell, current_selling, current_stocking,
                price_coast, alternate_sp, alternate_sps, bin_locations, location_tags, item_prices;

            for (var i = 0; i < vm.product.item_details.length; i++) {

                stores = {};
                suppliers = [];
                supplier = {};
                stock_sell = {};
                price_coast = {};
                alternate_sp = {};
                alternate_sps = [];
                bin_locations = [];
                location_tags = [];

                stores.ranking = vm.product.item_details[i]["ranking"];
                //If there is No supplier
                if (vm.product.item_details[i]["buying"]["suppliers"].length === 0) {
                    stores.suppliers = [];
                } else {

                    //Suppliers Info
                    suppliers = [];
                    for (var j = 0; j < vm.product.item_details[i]["buying"]["suppliers"].length; j++) {

                        supplier = {};
                        current_supplier = vm.product.item_details[i]["buying"]["suppliers"][j];

                        supplier.supplier_name = current_supplier.supplier_name;
                        supplier.supplier_sku = current_supplier.supplier_sku;
                        supplier.is_primary = current_supplier.is_primary;
                        if (vm.all_inventory_access_obj.access_costs_gp_information) {
                            supplier.replacement_cost = ep_currencyFilter(current_supplier.replacement_cost);
                        }
                        supplier.supplier_uom_code = current_supplier.supplier_uom_code;
                        supplier.order_multiple = current_supplier.order_multiple;
                        supplier.order_point = current_supplier.order_point;
                        supplier.max_stock = current_supplier.max_stock;

                        suppliers.push(supplier);
                    }
                    stores.suppliers = suppliers;

                }

                //If store gets Deleted then add is_deleted property
                if (vm.product.item_details[i].is_deleted) {
                    stores.deleted = vm.product.item_details[i].is_deleted;
                }

                //Stocking Info
                current_selling = vm.product.item_details[i]["selling"];
                current_stocking = vm.product.item_details[i]["stocking"];

                stock_sell.is_taxable = current_selling.is_taxable;
                stock_sell.is_discountable = current_selling.is_discountable;
                stock_sell.track_inventory = current_stocking.track_inventory;
                stock_sell.is_stocked = current_stocking.is_stocked;
                stock_sell.is_returnable = vm.product.item_details[i].is_returnable;
                stock_sell.is_loyalty_active = current_selling.is_loyalty_active;
                stock_sell.season = vm.product.item_details[i].season;
                stock_sell.tax_code_id = current_selling.tax_code_id || "";
                stock_sell.label_count_type = parseInt(current_selling.label_count_type) || 0;
                stock_sell.label_count = parseFloat(current_selling.label_count) || 0;
                stock_sell.prompt_pos_note = current_selling.prompt_pos_note;

                for (var k = 0; k < current_stocking.bin_locations.length; k++) {
                    bin_locations.push(current_stocking.bin_locations[k]);
                }

                stock_sell.bin_locations = bin_locations;

                for (var l = 0; l < vm.product.item_details[i].item_tags.length; l++) {
                    location_tags.push(vm.product.item_details[i].item_tags[l].id);
                }

                stock_sell.location_tags = location_tags;
                stores.stock_sell = stock_sell;


                if (vm.all_inventory_access_obj.access_price_cost) {
                    //Skip tracking of retail price if its Shipper,kit and Pricing method other than Set Price
                    if ((vm.product.product_type === product_kit && vm.product.kit_price_option !== 0) || vm.product.product_type === product_shipper) {
                        price_coast.retail = null;
                    } else {

                        // Price and Coast- Retail price -After client save/not changed from UI then vm.product... will be having value
                        for (var n = 0; n < vm.product.item_details[i].prices.length; n++) {
                            if (vm.product.item_details[i].prices[n].is_default === true && vm.product.item_details[i].prices[n].is_active === true && vm.product.price_by === 0) {
                                price_coast.retail = parseFloat(vm.product.item_details[i].prices[n].price) || 0;
                                break;
                            }
                        }
                    }

                    // Price and Coast- Alternate price -After Client save/Values not changed from UI then get values from vm.product...
                    if (vm.product.product_type !== product_kit && vm.product.product_type !== product_shipper) {

                        if (vm.product.item_details[i].prices.length > 1 && vm.product.price_by === 0) {
                            alternate_selling_price = vm.product.item_details[i].prices.filter(item => item.is_default === false);
                            alternate_selling_price = orderBy(alternate_selling_price, ['default_text'], false);

                            for (var w = 0; w < alternate_selling_price.length; w++) {
                                //Alternate Selling price
                                alternate_sp = {};
                                alternate_sp.price_type = parseInt(alternate_selling_price[w].price_type) || 0;
                                alternate_sp.price = parseFloat(alternate_selling_price[w].price) || 0;
                                alternate_sp.uom = alternate_selling_price[w].uom;
                                alternate_sp.selling_multiple = parseInt(alternate_selling_price[w].selling_multiple) || 0;
                                alternate_sp.price_method_name = alternate_selling_price[w].price_method_name;
                                alternate_sp.rounding_method_name = alternate_selling_price[w].rounding_method_name;
                                alternate_sps.push(alternate_sp);
                            }
                            price_coast.alternate_sps = alternate_sps;
                        } else {
                            price_coast.alternate_sps = {};
                        }
                        if (vm.product.product_type !== product_donation && vm.product.product_type !== product_membership_fee)
                            price_coast.keep_running_cost = vm.product.item_details[i].costs.keep_running_cost;
                    }


                    //If No client save but values changed in UI then extract Retail price from selling_price.amount and Alternate SP from vm.alternate_selling_price
                    if (vm.item && vm.item.id && vm.product.price_by === 0) {

                        if (vm.product.item_details[i].id == vm.item.id) {
                            item_prices = [];
                            item_prices = vm.update_prices_or_get_unsaved_prices('unsaved_tracker');
                            price_coast.retail = item_prices[0];
                            if (vm.product.product_type !== product_kit && vm.product.product_type !== product_shipper) {
                                price_coast.alternate_sps = item_prices[1];
                            }
                        }
                    }

                    stores.price_coasts = price_coast;
                }

                obj_Edited_prod.item_details.push(stores);

            }

        }

        //For UPC -General Tab
        if (vm.product.product_variants.length === 0) {
            obj_Edited_prod.alternate_codes = [];

        } else {
            alternate_codes = [];


            for (var s = 0; s < vm.product.product_variants[0].alternate_codes.length; s++) {
                alternate_code = {};
                alternate_code.uom = vm.product.product_variants[0].alternate_codes[s].uom;
                alternate_code.alternate_code = vm.product.product_variants[0].alternate_codes[s].alternate_code;
                alternate_code.is_primary = vm.product.product_variants[0].alternate_codes[s].is_primary;
                alternate_codes.push(alternate_code);
            }

            obj_Edited_prod.alternate_codes = alternate_codes;


        }

        //For Components Tab in Kits/Shipper
        if (vm.product.kit_components.length === 0) {
            obj_Edited_prod.kit_components = [];
        } else {
            kit_components_quantity = [];

            for (var n = 0; n < vm.product.kit_components.length; n++) {
                kit_components_quantity[n] = parseFloat(vm.product.kit_components[n].quantity) || 0;
            }
            obj_Edited_prod.kit_components_quantity = kit_components_quantity;
        }

        if (vm.all_inventory_access_obj.access_price_cost) {
            //For Retail price at Product level
            if (vm.product.product_variants[0].product_prices.length === 0 || vm.product.price_by === 0) {
                product_prices.product_level_retail_price = {};

            }

            //For Alternate SP at Product level
            if (vm.product.product_variants[0].product_prices.length === 1 || vm.product.price_by === 0) {
                product_prices.product_level_alternate_price = {};
            }


            if (vm.product.price_by === 2 && vm.product.product_variants[0].product_prices.length !== 0) {
                prod_prices = [];
                prod_prices = vm.update_prices_or_get_unsaved_prices('unsaved_tracker');
                product_prices.product_level_retail_price = prod_prices[0];

                if (vm.product.product_type !== product_kit && vm.product.product_type !== product_shipper) {
                    product_prices.product_level_alternate_price = prod_prices[1];
                }
            }


            obj_Edited_prod.product_price = product_prices;
        }


        return obj_Edited_prod;

    };

    //Since fill_product_record and get_edited_properties_for_unsaved_data methods having duplicate codes,below function has been written
    vm.update_prices_or_get_unsaved_prices = function (caller, x) {
        if (vm.selling_price.selling_price_uom != vm.product.default_selling_uom) {
            vm.selling_price.selling_price_uom = vm.product.default_selling_uom;
        }

        let remove_alternate_unit = function (array) {
            //When the product is deleting, remove all the alternate prices apart from default only when the grid datasource is empty.
            let remove_index_values = [];
            if (vm.alternate_unit_grid_data_source.data().toJSON().length <= 0) {
                for (let i = 0; i < array.length; i++) {
                    if (!array[i].is_default) {
                        remove_index_values.push(i);
                    }
                }
                for (let y = remove_index_values.length - 1; y >= 0; y--) {
                    array.splice(remove_index_values[y], 1);
                }
            }
        };

        if (caller == 'product_level') {
            vm.product.product_variants[vm.variant_main_id].product_prices.push({
                price_type: vm.system_default_price_type,
                uom: vm.selling_price.selling_price_uom,
                uom_name: vm.selling_price.selling_price_uom_name,
                price: vm.selling_price.product_amount !== null ? parseFloat(vm.selling_price.product_amount) : null,
                selling_multiple: vm.product_selling_uom_multiple,
                is_default: true,
                id: vm.selling_price.product_price
            });

            angular.forEach(vm.alternate_unit_grid_data_source.data().toJSON(), function (price_record) {
                vm.product.product_variants[vm.variant_main_id].product_prices.push({
                    price_type: price_record.price_type,
                    uom: price_record.selling_price_uom ? price_record.selling_price_uom : price_record.uom,
                    uom_name: price_record.selling_price_uom_name,
                    price: parseFloat(price_record.price),
                    selling_multiple: price_record.selling_multiple,
                    is_default: false,
                    variant: vm.variant_main_value,
                    id: price_record.product_price,
                    product_price: price_record.newly_added ? price_record.product_price : null,

                    //Added new keys for alternate grid implementation
                    default_text: price_record.default_text,
                    discount_off_retail_percent: price_record.price_method === 1 ? price_record.markup_price : null,
                    markup_from_retail_percent: price_record.price_method === 2 ? price_record.markup_price : null,
                    markup_price: price_record.markup_price,
                    newly_added: price_record.newly_added,
                    price_method_name: price_record.price_method_name,
                    product_gross_profit: price_record.product_gross_profit,
                    rounding_method: price_record.rounding_method,
                    rounding_method_name: price_record.rounding_method_name,
                    selling_product_amount: price_record.selling_product_amount,
                    stocking_price_uom_name: price_record.stocking_price_uom_name,
                    price_method: price_record.price_method,
                    temp_id: price_record.temp_id,
                    selling_price_uom_name: price_record.selling_price_uom_name
                });
            });

            remove_alternate_unit(vm.product.product_variants[vm.variant_main_id].product_prices);
        } else if (caller == 'item_level') {
            vm.product.item_details[x].prices.push({
                price_type: vm.system_default_price_type,
                uom: vm.product_selling_uom,
                uom_code: vm.product_selling_uom_name,
                price: vm.selling_price.amount !== null && angular.isDefined(vm.selling_price.amount) ? parseFloat(vm.selling_price.amount) : null,
                selling_multiple: vm.product_selling_uom_multiple,
                is_default: true,
                is_active: true,
                id: vm.selling_price.id,
                product_price: vm.selling_price.product_price,
                variant: vm.variant_main_value
            });

            // Add in the alternate item level price types
            angular.forEach(vm.alternate_unit_grid_data_source.data().toJSON(), function (alternate_price) {
                if (!alternate_price.id || alternate_price.id === alternate_price.product_price) {
                    alternate_price.id = null;
                }
                vm.product.item_details[x].prices.push({
                    price_type: parseInt(alternate_price.price_type),
                    uom: alternate_price.selling_price_uom ? alternate_price.selling_price_uom : alternate_price.uom,
                    price: parseFloat(alternate_price.price),
                    selling_multiple: alternate_price.selling_multiple,
                    is_default: false,
                    is_active: true,
                    variant: vm.variant_main_value,
                    id: alternate_price.id ? alternate_price.id : null,
                    default_text: alternate_price.default_text,
                    product_price: alternate_price.product_price ? alternate_price.product_price : null,

                    //Newly added keys for grid implementation for alternate units
                    discount_off_retail_percent: alternate_price.price_method === 1 ? alternate_price.markup_price : null,
                    markup_from_retail_percent: alternate_price.price_method === 2 ? alternate_price.markup_price : null,
                    markup_price: alternate_price.markup_price,
                    newly_added: alternate_price.newly_added,
                    price_method_name: alternate_price.price_method_name,
                    product_gross_profit: alternate_price.product_gross_profit,
                    rounding_method: alternate_price.rounding_method,
                    rounding_method_name: alternate_price.rounding_method_name,
                    selling_product_amount: alternate_price.selling_product_amount,
                    stocking_price_uom_name: alternate_price.stocking_price_uom_name,
                    price_method: alternate_price.price_method,
                    temp_id: alternate_price.temp_id,
                    selling_price_uom_name: alternate_price.selling_price_uom_name
                });
            });
            for (let j = 0; j < vm.product.item_details.length; j++) {
                remove_alternate_unit(vm.product.item_details[j].prices);
            }
        } else {
            var prices = [], alternate_sp = {}, alternate_sps = [], price_coast = {}, alternate_selling_price = [];


            //Skip tracking retail in case Shipper,Kits having price other than Set Price
            if ((vm.product.product_type === product_kit && vm.product.kit_price_option !== 0) || vm.product.product_type === product_shipper) {
                prices.push(null);
            } else {
                //Consider by default will have Retail price,So directly fetching without any condition
                prices.push(parseFloat(vm.selling_price.amount) || 0);
            }

            if (vm.product.product_type !== product_kit && vm.product.product_type !== product_shipper) {

                if (vm.alternate_unit_grid_data_source.data().toJSON().length > 0) {
                    alternate_selling_price = orderBy(vm.alternate_unit_grid_data_source.data().toJSON(), ['default_text'], false);
                    alternate_sps = [];
                    for (var q = 0; q < alternate_selling_price.length; q++) {
                        //Alternate Selling price
                        alternate_sp = {};
                        alternate_sp.price_type = parseInt(alternate_selling_price[q].price_type) || 0;
                        alternate_sp.price = parseFloat(alternate_selling_price[q].price) || 0;
                        alternate_sp.uom = alternate_selling_price[q].selling_price_uom;
                        alternate_sp.selling_multiple = parseInt(alternate_selling_price[q].selling_multiple) || 0;
                        alternate_sp.price_method_name = alternate_selling_price[q].price_method_name;
                        alternate_sp.rounding_method_name = alternate_selling_price[q].rounding_method_name;
                        alternate_sps.push(alternate_sp);
                    }
                    price_coast.alternate_sps = alternate_sps;
                } else {
                    price_coast.alternate_sps = {};
                }
                prices.push(price_coast.alternate_sps);

            }

            return prices;
        }
    };


    /*
        Start of alternate selling unit code.
     */

    const _reset_alternate_unit = function () {
        vm.alternate_unit = {
            price_type: vm.system_default_price_type,
            default_text: vm.system_default_price_type_name,
            is_default: false,
            uom: vm.product.default_selling_uom,
            selling_price_uom_name: vm.product.default_selling_uom_name,
            //selling_multiple: 1,
            selling_multiple: ep_decimalFilter(vm.product.default_selling_multiple),
            price_method: 0,
            price_method_name: 'Set Price',
            rounding_method: undefined,
            markup_from_retail_percent: null,
            discount_off_retail_percent: null,
            price: 0,
            markup_price: 0.00,
            selling_product_amount: 0,
            product_gross_profit: '',
            stocking_price_uom_name: vm.product_stocking_uom_name,
            newly_added: true,
            product_price: null,
            id: null,
            temp_id: Math.floor(1000 + Math.random() * 9000),
            is_deleted: false
        };

        vm.disable_pricing_method_dd = true;
    };

    const _set_alternate_grid_initial_flags = function () {
        vm.is_toolbar_excel_button_enabled = false;
        vm.is_actions_toolbar_buttons_enabled = false;
        vm.pricing_method_data_source = new kendo.data.DataSource({
            data: vm.product_choices.price_method
        });

        vm.rounding_method_datasource = new kendo.data.DataSource({
            data: vm.product_choices.rounding_method
        });

        _reset_alternate_unit();

        vm.alternate_unit_price_type_options = {
            dataTextField: "name",
            dataValueField: "id",
            change: function () {
                vm.alternate_unit.price_type = parseInt(vm.alternate_unit.price_type);
                vm.alternate_unit.default_text = this.text();
            },
            virtual: {
                itemHeight: 30,
                valueMapper: function (options) {
                    if (options.value) {
                        let mapper_data = {
                            key_name: "id",
                            keys: [parseInt(options.value)]
                        };
                        pricing_price_type_value_mapper_index_service.pricing_price_type_value_mapper(mapper_data).then(function (result) {
                            if (result.indexes[0] == null) {
                                result.indexes = [];
                            }
                            options.success(result.indexes);
                        }, function (error) {
                            util.handleErrorWithWindow(error);
                        });
                    }
                }
            }
        };

        vm.disable_pricing_method_dd = true;
        vm.alternate_pricing_method_options = {
            dataTextField: "name",
            dataValueField: "id",
            change: function () {
                vm.alternate_unit.price_method_name = this.text();
                if (this.value() == 1 || this.value() == 2) {
                    vm.disable_pricing_method_dd = false;
                } else {
                    vm.disable_pricing_method_dd = true;
                    var dropdownlist = $("#alternate_pricing_rounding_method").data("kendoDropDownList");
                    dropdownlist.value("");
                    vm.alternate_unit.rounding_method = undefined;
                    vm.alternate_unit.rounding_method_name = undefined;
                }

                // A safe check to avoid dirty digest cycle collision on multi select operations
                if (!$scope.$root.$$phase) {
                    $scope.$apply();
                }
            }
        };

        vm.alternate_unit_uom_options = {
            dataSource: product_uom_service.get_record_server_filter_data_source(util.ad_find_options(true, false), product_uom_service.filter_none(), util.datasource_pagesize, $scope),
            dataTextField: "code",
            dataValueField: "id",
            change: function () {
                vm.alternate_unit.selling_price_uom_name = this.text();
                //If default UOM selected then set the default selling uom.
                if (this.value() == vm.system_default_stocking_uom) {
                    vm.alternate_unit.selling_multiple = ep_decimalFilter(vm.product.default_selling_multiple);
                    // A safe check to avoid dirty digest cycle collision on multi select operations
                    if (!$scope.$root.$$phase) {
                        $scope.$apply();
                    }
                }
            },
            virtual: {
                itemHeight: 30,
                valueMapper: function (options) {
                    if (options.value) {
                        let mapper_data = {
                            key_name: "id",
                            keys: [parseInt(options.value)]
                        };
                        product_uom_value_mapper_index_service.product_uom_value_mapper(mapper_data).then(function (result) {
                            if (result.indexes[0] == null) {
                                result.indexes = [];
                            }
                            options.success(result.indexes);
                        }, function (error) {
                            util.handleErrorWithWindow(error);
                        });
                    }
                }
            }
        };

        vm.alternate_pricing_rounding_method_options = {
            dataTextField: "name",
            dataValueField: "id",
            optionLabel: "",
            change: function () {
                vm.alternate_unit.rounding_method_name = this.text();
                if (!$scope.$root.$$phase) // A safe check to avoid dirty digest cycle collision on multi select operations
                    $scope.$apply();
            }
        };

        vm.alternate_unit_price_options = {
            spinners: false,
            min: 0,
            decimals: 2,
            max: 999999999.99,
            format: "n2",
            round: false,
            restrictDecimals: true
        };

        vm.alternate_unit_markup_cost_options = {
            spinners: false,
            min: 0.01,
            max: 999.99,
            decimals: 2,
            round: false,
            restrictDecimals: true
        };

        vm.alternate_unit_discount_off_options = {
            spinners: false,
            min: 0.01,
            max: 100,
            decimals: 2,
            round: false,
            restrictDecimals: true
        };

        vm.alternate_unit_selling_uom_multiple_options = {
            format: "n2",
            decimals: 2,
            min: 0,
            max: 99999.00,
            spinners: false,
            round: false,
            restrictDecimals: true
        };

        vm.alternate_unit_price_type_selected = function (kendo_event) {
            console.log('alternate unit price type selected...');
        };

        vm.alternate_unit_pricing_method_selected = function () {

        };

        vm.alternate_unit_price_rounding_method_selected = function () {

        };
    };

    /*
        If the default price type is changing to any other non-default price for which alternate unit record is existing with Same UOM as currently changing default
        price then validate it.
     */
    const _validate_change_default_price_type = function (data_item) {
        let grid_data = vm.alternate_unit_grid_data_source.data().toJSON();
        let found_default_type_uom = false;
        for (let i = 0; i < grid_data.length; i++) {
            //when price type is not default and the UOM is for default price and any other price is same then
            if (grid_data[i].default_text != vm.system_default_price_type_name && grid_data[i].uom == data_item.uom) {
                found_default_type_uom = true;
                break;
            }
        }
        return found_default_type_uom;
    };

    const _alternate_unit_price_type_editor = function (container, options) {
        $('<input required name="' + options.field + '"/>')
            .appendTo(container)
            .kendoDropDownList({
                autoBind: false,
                dataTextField: "name",
                dataValueField: "name",
                index: 0,
                template: "<span data-id='${data.id}'>${data.name}</span>",
                select: function (e) {
                    let event_data = e.dataItem;
                    let editing_row = e.sender.element.closest('.k-grid-edit-row'), editing_row_data;
                    let editing_row_uid = e.sender.element.closest('.k-grid-edit-row').attr('data-uid');
                    let grid_rows = $("#alternate_unit_grid tbody").find('tr'), row;
                    let grid = $("#alternate_unit_grid").data('kendoGrid'), data_item, is_duplicate = false;
                    let previous_name = grid.dataItem(editing_row).default_text;
                    let default_price_changed = false;

                    //Check for the duplicate price type
                    for (let i = 0; i < grid_rows.length; i++) {
                        row = grid_rows[i];
                        data_item = grid.dataItem(row);
                        editing_row_data = grid.dataItem(editing_row);
                        if (data_item.uid !== editing_row_uid) {
                            if (data_item.default_text === event_data.name && data_item.selling_price_uom_name === editing_row_data.selling_price_uom_name) {
                                is_duplicate = true;
                            }
                        }
                    }

                    //Validate default price type change, Cannot change the default price type to some other price type.
                    if (previous_name === vm.system_default_price_type_name) {
                        let data_item = grid.dataItem(editing_row);
                        default_price_changed = _validate_change_default_price_type(data_item);
                        if (default_price_changed) {
                            let td = $(e.sender.element).closest("td");
                            let dropdown_list = td.find('input[name=default_text]').data("kendoDropDownList");
                            let reset_dirty_field = function () {
                                $timeout(function () {
                                    if (data_item && data_item.dirtyFields && data_item.dirtyFields.default_text) {
                                        data_item.dirtyFields.default_text = false;
                                    }
                                }, 50);
                            };
                            $timeout(function () {
                                dropdown_list.select(function (data_item) {
                                    return data_item.name === previous_name;
                                });
                                //reset_dirty_field();
                            });
                            StdDialog.information(`The Price Type cannot be changed for an alternate selling UOM where the Price Type is the default. <br><br> For Instance, if your default Price Type is "Retail" and you have an alternate selling unit of case, there must be an instance of this alternate selling unit with the Price Type of Retail.`);
                        }
                    }

                    if (is_duplicate) {
                        StdDialog.information('The combination of Price Type and Unit of Measure must make a unique set');
                        //Select back the original value of the dropdown.
                        let td = $(e.sender.element).closest("td");
                        let dropdown_list = td.find('input[name=default_text]').data("kendoDropDownList");
                        dropdown_list.select(function (data_item) {
                            return data_item.name === previous_name;
                        });
                        e.preventDefault();
                    }

                    if (!is_duplicate && !default_price_changed) {
                        let grid = e.sender.element.closest(".k-grid").data("kendoGrid");
                        let row = e.sender.element.closest("tr");
                        let dataItem = grid.dataItem(row);
                        var id = e.item.find("span").attr("data-id");
                        dataItem.price_type = parseInt(id);
                        dataItem.default_text = this.text();
                        _get_latest_price_gp_percentage(dataItem, function (error, calculated_data) {
                            dataItem.price = calculated_data.data[0].alternate_price;
                            dataItem.product_gross_profit = calculated_data.data[0].gp ? calculated_data.data[0].gp : 0;
                            grid.refresh();
                        });
                    }
                },
                dataSource: pricing_sales_price_type_service.get_record_server_filter_data_source(util.ad_find_options(true, false), pricing_sales_price_type_service.filter_none(), util.datasource_pagesize, $scope),
                virtual: {
                    itemHeight: 30,
                    valueMapper: function (options) {
                        if (options.value) {
                            let mapper_data = {
                                key_name: "name",
                                keys: [options.value]
                            };
                            pricing_price_type_value_mapper_index_service.pricing_price_type_value_mapper(mapper_data).then(function (result) {
                                if (result.indexes[0] == null) {
                                    result.indexes = [];
                                }
                                options.success(result.indexes);
                            }, function (error) {
                                util.handleErrorWithWindow(error);
                            });
                        }
                    }
                }
            });
        $(container).addClass('ep-generic-class');

    };

    const _alternate_unit_sell_price_grid_editor = function (container, options) {
        $('<input data-bind="value:' + options.field + '" name="alternate_unit_selling_numeric_input" maxlength="12" />')
            .appendTo(container)
            .kendoNumericTextBox({
                value: options.field,
                spinners: false,
                min: 0.00,
                decimals: 2,
                max: 999999999.99,
                format: "n3",
                round: false,
                restrictDecimals: true,
                change: function (event) {
                    let grid = event.sender.element.closest(".k-grid").data("kendoGrid");
                    let row = event.sender.element.closest("tr");
                    let data_item = grid.dataItem(row);
                    data_item.product_gross_profit = vm.calculate_gross_profit(this.value(), data_item.selling_price_uom, data_item.selling_multiple);
                    data_item.selling_product_amount = this.value();
                    data_item.price_changed = true;

                    _get_latest_price_gp_percentage(data_item, function (error, calculated_data) {
                        data_item.price = calculated_data.data[0].alternate_price;
                        data_item.product_gross_profit = calculated_data.data[0].gp ? calculated_data.data[0].gp : 0;
                        grid.refresh();
                    });
                }
            });
        $(container).addClass('ep-generic-class');
        console.log($(container).html());
    };

    const _alternate_unit_UOM_grid_editor = function (container, options) {
        $('<input required name="' + options.field + '"/>')
            .appendTo(container)
            .kendoDropDownList({
                autoBind: false,
                dataTextField: "code",
                dataValueField: "code",
                template: "<span data-id='${data.id}'>${data.code}</span>",
                index: 0,
                select: function (e) {
                    const grid = $("#alternate_unit_grid").data('kendoGrid');
                    var id = e.item.find("span").attr("data-id");
                    var row = $(e.sender.element).closest("tr");
                    var data = grid.dataItem(row);
                    var previous_id = data.selling_price_uom, previous_name = data.selling_price_uom_name;


                    //Validate for duplicate records
                    let event_data = e.dataItem;
                    let editing_row = e.sender.element.closest('.k-grid-edit-row'), editing_row_data;
                    let editing_row_uid = e.sender.element.closest('.k-grid-edit-row').attr('data-uid');
                    let grid_rows = $("#alternate_unit_grid tbody").find('tr');
                    let data_item, is_duplicate = false, duplicate_data_item;
                    for (let i = 0; i < grid_rows.length; i++) {
                        row = grid_rows[i];
                        data_item = grid.dataItem(row);
                        editing_row_data = grid.dataItem(editing_row);
                        if (data_item.uid !== editing_row_uid) {
                            if (data_item.default_text === editing_row_data.default_text && data_item.selling_price_uom_name === event_data.code) {
                                duplicate_data_item = data_item;
                                is_duplicate = true;
                            }
                        }
                    }

                    //When the selecting UOM is same as default uom show the duplicate record message
                    if (event_data.code == vm.product_selling_uom_name) {
                        is_duplicate = true;
                    }

                    if (is_duplicate) {
                        StdDialog.information('The combination of Price Type and Unit of Measure must make a unique set');
                        let td = $(e.sender.element).closest("td");
                        let dropdown_list = td.find('input[name=selling_price_uom_name]').data("kendoDropDownList");
                        $timeout(function () {
                            dropdown_list.select(function (data_item) {
                                return data_item.code === previous_name;
                            });
                        });
                        e.preventDefault();
                    } else {
                        data.uom = parseInt(id);
                        data.selling_price_uom = parseInt(id);
                        data.product_gross_profit = vm.calculate_gross_profit(data.price, data.selling_price_uom, data.selling_multiple);
                        _get_latest_price_gp_percentage(data, function (error, calculated_data) {
                            data.price = calculated_data.data[0].alternate_price;
                            data.product_gross_profit = calculated_data.data[0].gp ? calculated_data.data[0].gp : 0;
                            grid.refresh();
                        });
                    }
                },
                change: function (event) {
                },
                virtual: {
                    itemHeight: 30,
                    valueMapper: function (options) {
                        if (options.value) {
                            let mapper_data = {
                                key_name: "code",
                                keys: [options.value]
                            };
                            product_uom_value_mapper_index_service.product_uom_value_mapper(mapper_data).then(function (result) {
                                if (result.indexes[0] == null) {
                                    result.indexes = [];
                                }
                                options.success(result.indexes);
                            }, function (error) {
                                util.handleErrorWithWindow(error);
                            });
                        }
                    }
                },
                dataSource: product_uom_service.get_record_server_filter_data_source(util.ad_find_options(true, false), product_uom_service.filter_none(), util.datasource_pagesize, $scope)
            });
        $(container).addClass('ep-generic-class');
    };

    const _alternate_unit_pricing_method_editor = function (container, options) {
        $('<input required name="' + options.field + '"/>')
            .appendTo(container)
            .kendoDropDownList({
                autoBind: false,
                dataTextField: "name",
                dataValueField: "name",
                template: "<span data-id='${data.id}'>${data.name}</span>",
                index: 0,
                select: function (e) {
                    const grid = $("#alternate_unit_grid").data('kendoGrid');
                    var id = e.item.find("span").attr("data-id");
                    var data = grid.dataItem($(e.sender.element).closest("tr"));
                    data.price_method = parseInt(id);
                    if (data.price_method === 1 && data.markup_price >= 100) {
                        data.markup_price = 100.00;
                    }
                    _get_latest_price_gp_percentage(data, function (error, calculated_data) {
                        data.price = calculated_data.data[0].alternate_price;
                        data.product_gross_profit = calculated_data.data[0].gp ? calculated_data.data[0].gp : 0;
                        //grid.refresh();
                    });
                },
                change: function (event) {
                    let grid = event.sender.element.closest(".k-grid").data("kendoGrid");
                    let row = event.sender.element.closest("tr");
                    let row_data = grid.dataItem(row);
                    let cell = {};
                    if (this.value() === 'Set Price') {
                        cell = row.find("td.alternate_sell_price");
                        //row_data.markup_price = '';
                        row_data.markup_price = null;
                        //Empty rounding method
                        this.value("");
                        row_data.rounding_method = undefined;
                        row_data.rounding_method_name = undefined;
                        grid.editCell(cell);
                    } else {
                        cell = row.find("td.markup_down_cell");
                        row_data.price = '';
                        //also set rounding method - set to Use Rounding Table
                        this.value("Use Price Rounding Table");
                        row_data.rounding_method = 3;
                        row_data.rounding_method_name = 'Use Price Rounding Table';
                        grid.editCell(cell);
                    }
                },
                dataSource: vm.pricing_method_data_source
            });
        $(container).addClass('ep-generic-class');
    };

    const _alternate_unit_rounding_method_editor = function (container, options) {
        $('<input required name="' + options.field + '"/>')
            .appendTo(container)
            .kendoDropDownList({
                autoBind: false,
                dataTextField: "name",
                dataValueField: "name",
                template: "<span data-id='${data.id}'>${data.name}</span>",
                index: 0,
                select: function (e) {
                    const grid = $("#alternate_unit_grid").data('kendoGrid');
                    var id = e.item.find("span").attr("data-id");
                    var data = grid.dataItem($(e.sender.element).closest("tr"));
                    data.rounding_method = parseInt(id);
                    _get_latest_price_gp_percentage(data, function (error, calculated_data) {
                        data.price = calculated_data.data[0].alternate_price;
                        data.product_gross_profit = calculated_data.data[0].gp ? calculated_data.data[0].gp : 0;
                        grid.refresh();
                    });
                },
                dataSource: vm.rounding_method_datasource
            });
        $(container).addClass('ep-generic-class');
    };

    const _alternate_unit_markup_price_grid_editor = function (container, options) {
        $('<input data-bind="value:' + options.field + '" name="alternate_unit_markup_numeric_input" maxlength="6"/>')
            .appendTo(container)
            .kendoNumericTextBox({
                value: options.field,
                min: 0.01,
                max: 999.99,
                format: "n2",
                decimals: 2,
                spinners: false,
                round: false,
                restrictDecimals: true,
                change: function (event) {
                    const grid = $("#alternate_unit_grid").data('kendoGrid');
                    var data = grid.dataItem($(event.sender.element).closest("tr"));
                    if (data.price_method === 1 && this.value() >= 100) {
                        this.value(100.00);
                        data.markup_price = 100.00;
                    }

                    // if(data.price_method === 1){
                    //     data.discount_off_retail_percent = this.value();
                    // } else if(data.price_method === 2){
                    //     data.markup_from_retail_percent = this.value();
                    // } else {
                    //     data.discount_off_retail_percent = null;
                    //     data.markup_from_retail_percent = null;
                    // }

                    _get_latest_price_gp_percentage(data, function (error, calculated_data) {
                        data.price = calculated_data.data[0].alternate_price;
                        data.product_gross_profit = calculated_data.data[0].gp ? calculated_data.data[0].gp : 0;
                        grid.refresh();
                    });
                }
            });
        $(container).addClass('ep-generic-class');
    };

    const _alternate_unit_sell_multiple_grid_editor = function (container, options) {
        $('<input data-bind="value:' + options.field + '" name="alternate_unit_sell_multiple_numeric_input" maxlength="8" />')
            .appendTo(container)
            .kendoNumericTextBox({
                value: options.field,
                min: 0,
                max: 99999.00,
                decimals: 2,
                spinners: false,
                format: "n2",
                round: false,
                restrictDecimals: true,
                change: function (event) {
                    let grid = event.sender.element.closest(".k-grid").data("kendoGrid");
                    let row = event.sender.element.closest("tr");
                    let data_item = grid.dataItem(row);
                    if (!_validate_duplicate_sell_muitple(data_item.uom, this.value())) {
                        StdDialog.information('Duplicate selling multiple for default selling multiple not allowed.');
                        return;
                    }
                    data_item.product_gross_profit = vm.calculate_gross_profit(data_item.price, data_item.selling_price_uom, this.value());
                    _get_latest_price_gp_percentage(data_item, function (error, calculated_data) {
                        data_item.price = calculated_data.data[0].alternate_price;
                        data_item.product_gross_profit = calculated_data.data[0].gp ? calculated_data.data[0].gp : 0;
                        grid.refresh();
                    });
                }
            });
        $(container).addClass('ep-generic-class');
    };

    const _alternate_grid_price_type_template = function (id) {
        let price_type = id, dropdown_data = vm.selling_price_type_data_source.data().toJSON();
        for (let i = 0; i < dropdown_data.length; i++) {
            if (dropdown_data[i].id === id) {
                price_type = dropdown_data[i].name;
            }
        }
        return price_type;
    };

    const _alternate_grid_pricing_method_template = function (id) {
        let price_type = id, dropdown_data = vm.pricing_method_data_source.data().toJSON();
        for (let i = 0; i < dropdown_data.length; i++) {
            if (dropdown_data[i].id === id) {
                price_type = dropdown_data[i].name;
            }
        }
        return price_type;
    };

    /*
        Get latest calculations for Sell Price and GP % from server side.
     */
    const _prepare_calculation_payload = function (data_item) {
        let payload = [];
        if (data_item && data_item instanceof Array) {
            for (let i = 0; i < data_item.length; i++) {
                payload.push({
                    retail_price: vm.selling_price.amount,
                    default_selling_multiple: vm.product.default_selling_multiple,
                    selling_multiple: data_item[i].selling_multiple ? data_item[i].selling_multiple : 1,
                    pricing_method: data_item[i].price_method,
                    pricing_adjustment_percent: data_item[i].markup_price ? data_item[i].markup_price : 0,
                    rounding_method: data_item[i].rounding_method ? data_item[i].rounding_method : 0,
                    replacement_cost: vm.item.costs && vm.item.costs.replacement_cost ? vm.item.costs.replacement_cost : 0.00,
                    new_price: data_item[i].price ? parseFloat(data_item[i].price) : 0,
                    price_type_id: data_item[i].price_type,
                    uom_id: data_item[i].uom
                });
            }
        } else {
            payload.push({
                retail_price: vm.selling_price.amount,
                default_selling_multiple: vm.product.default_selling_multiple,
                selling_multiple: data_item.selling_multiple ? data_item.selling_multiple : 1,
                pricing_method: data_item.price_method,
                pricing_adjustment_percent: data_item.markup_price ? data_item.markup_price : 0,
                rounding_method: data_item.rounding_method ? data_item.rounding_method : 0,
                replacement_cost: vm.item.costs && vm.item.costs.replacement_cost ? vm.item.costs.replacement_cost : 0,
                new_price: data_item.price ? parseFloat(data_item.price) : 0,
                price_type_id: data_item.price_type,
                uom_id: data_item.uom
            });
        }
        return payload;
    };

    const _get_latest_price_gp_percentage = function (data_item, callback) {
        //if(vm.selling_price.amount && vm.selling_price.amount != 0){

        if (typeof vm.selling_price.amount === 'number' && !isNaN(vm.selling_price.amount)) {
            let gridElement = $("#alternate_unit_grid");
            let payload = _prepare_calculation_payload(data_item);
            kendo.ui.progress(gridElement, true);
            product_product_service.get_alternate_grid_calculations(vm.product.id, payload).then(function (response) {
                kendo.ui.progress(gridElement, false);
                for (let i = 0; i < response.data.length; i++) {
                    response.data[i].alternate_price = response.data[i].alternate_price ? response.data[i].alternate_price : 0.00;
                    response.data[i].gp = response.data[i].gp ? response.data[i].gp : 0;
                }
                return callback(null, response);
            }, function (error) {
                kendo.ui.progress(gridElement, false);
                $timeout(function () {
                    util.handleErrorWithWindow(error);
                });
                return callback(error);
            });
        } else {
            StdDialog.error('Default Price is required to get GP% and Price Calculation for Alternate Selling Unit. Please provide the default price to get price and GP% calculations.');
        }
    };

    /*
            Reset all dirty fields to false, particulary after save is done.
     */
    const _reset_grid_dirty_flags = function () {
        let grid = $("#alternate_unit_grid").data('kendoGrid');
        if (grid) {
            let grid_data = grid.dataSource.data();
            let keys = [];
            for (var i = 0; i < grid_data.length; i++) {
                keys = Object.keys(grid_data[i].dirtyFields);
                keys.forEach(function (key) {
                    grid_data[i].dirtyFields[key] = false;
                });
            }
        }
    };

    /*
          When selling multiple is same as default selling multiple and selling UOM != Stocking UOM, then show the validation error.
     */
    const _validate_duplicate_sell_muitple = function (sell_uom, sell_multiple) {
        let is_valid = true;
        if (sell_uom != vm.system_default_stocking_uom && ep_decimalFilter(sell_multiple) == ep_decimalFilter(vm.product.default_selling_multiple)) {
            is_valid = false;
        }

        return is_valid;
    };

    const _initiate_alternative_units_grid = function () {
        vm.alternate_unit_grid_options = {
            columns: [
                {
                    selectable: true,
                    width: 50,
                    minResizableWidth: 40,
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    }
                },
                {
                    title: "Price Type",
                    field: "default_text",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left ep-inline-grid-editable-input"
                    },
                    width: 200,
                    // template: function(id){
                    //     return _alternate_grid_price_type_template(id.default_text);
                    // },
                    editor: _alternate_unit_price_type_editor,
                    menu: false,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Sell Price",
                    field: "price",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right alternate_sell_price ep-inline-grid-editable-input"
                    },
                    width: 130,
                    editable: function (data_item) {
                        return (data_item.price_method === 0) ? true : false;
                    },
                    format: "{0:n3}",
                    editor: _alternate_unit_sell_price_grid_editor,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Sell UOM",
                    field: "selling_price_uom_name",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {"class": "ep-inline-grid-editable-input"},
                    width: 70,
                    editor: _alternate_unit_UOM_grid_editor,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Sell Multiple",
                    field: "selling_multiple",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right ep-inline-grid-editable-input"
                    },
                    format: "{0:n2}",
                    editor: _alternate_unit_sell_multiple_grid_editor,
                    width: 90,
                    menu: false,
                    editable: function (data_item) {
                        return (data_item.selling_price_uom_name != vm.product_stocking_uom_name) ? true : false;
                    },
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Stock UOM",
                    field: "stocking_price_uom_name",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left"
                    },
                    width: 70,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "GP %",
                    field: "product_gross_profit",
                    hidden: !util.verify_permission('access_costs_gp_information'),
                    menu: util.verify_permission('access_costs_gp_information'),
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right"
                    },
                    width: 70,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Method",
                    field: "price_method_name",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-inline-grid-editable-input"
                    },
                    width: 150,
                    menu: false,
                    editor: _alternate_unit_pricing_method_editor,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Mark Up Down %",
                    field: "markup_price",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-right ep-inline-grid-editable-input markup_down_cell"
                    },
                    width: 90,
                    editable: function (data_item) {
                        return (data_item.price_method !== 0) ? true : false;
                    },
                    template: '<span>{[{dataItem.markup_price | ep_decimal}]}</span>',
                    editor: _alternate_unit_markup_price_grid_editor,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                },
                {
                    title: "Price Rounded By",
                    field: "rounding_method_name",
                    headerAttributes: {
                        "class": "ep-table-header-cell"
                    },
                    attributes: {
                        "class": "ep-table-cell-left ep-inline-grid-editable-input"
                    },
                    width: 190,
                    editable: function (data_item) {
                        return (data_item.price_method !== 0) ? true : false;
                    },
                    editor: _alternate_unit_rounding_method_editor,
                    minResizableWidth: util.ep_grid_column_min_resize_width
                }
            ],
            columnMenu: util.ep_grid_column_menu,
            toolbar: [{
                template: kendo.template($("#alternate_selling_price_grid_toolbar").html())
            }
            ],
            sortable: false,
            pageable: util.ep_grid_pageable_options,
            scrollable: util.ep_grid_scrollable,
            filterable: util.ep_grid_filterable,
            reorderable: util.ep_grid_reorderable,
            resizable: util.ep_grid_resizeable,

            editable: true,
            navigatable: true,
            persistSelection: true,
            dataBound: function (e) {
                const gridElement = $("#alternate_unit_grid");
                if (gridElement) {
                    const grid = gridElement.data('kendoGrid');
                    const dataArea = gridElement.find(".k-grid-content");
                    if (grid.dataSource.total() === 0) {
                        dataArea.height(0);
                    } else {
                        dataArea.height(util.maintenance_grid_view_grid_height);
                    }
                    grid.clearSelection();
                    non_reorderable_column = grid.columns[0];
                }
            },
            change: function (e) {
                vm.is_actions_toolbar_buttons_enabled = (this.select().length > 0) ? true : false;
                if (!$scope.$root.$$phase) // A safe check to avoid dirty digest cycle collision on multi select operations
                    $scope.$apply();
            },
            edit: function (event) {
                const grid = this;
                const grid_ds = grid.dataSource;
                if (!grid_ds || !grid_ds.hasChanges()) {
                    vm.is_toolbar_excel_button_enabled = false;
                    vm.is_actions_toolbar_buttons_enabled = false;
                }

                if (!$scope.$root.$$phase)
                    $scope.$apply();
            },
            columnReorder: function (e) {
                const grid = e.sender;
                $timeout(() => {
                    grid.reorderColumn(0, non_reorderable_column);
                })
            }
        };
    };

    const _refresh_alternate_grid = function () {
        if (vm.product.product_type !== product_kit || vm.product.product_type !== product_shipper || vm.product.product_type !== product_membership_fee || vm.product.product_type !== product_fee || vm.product.product_type !== product_donation) {
            _set_alternate_grid_initial_flags();
            _initiate_alternative_units_grid();
            _alternate_unit_grid_data_source();
        }
    };

    const _alternate_unit_grid_data_source = function () {
        //Set GP%
        for (let i = 0; i < vm.alternate_selling_price.length; i++) {
            if (vm.alternate_selling_price[i].price_method == 0) {
                vm.alternate_selling_price[i].markup_price = null;
            }

            //also check for the rounding method and set the decimal places here.
            vm.alternate_selling_price[i].product_gross_profit = vm.calculate_gross_profit(vm.alternate_selling_price[i].price, vm.alternate_selling_price[i].uom, vm.alternate_selling_price[i].selling_multiple);

            if (vm.alternate_selling_price[i].rounding_method === 2) {
                vm.alternate_selling_price[i].price = ep_decimalFilter(vm.alternate_selling_price[i].price, 3, false);
            } else {
                vm.alternate_selling_price[i].price = ep_decimalFilter(vm.alternate_selling_price[i].price, 2, false);
            }
        }

        let datasource_data = {
            prices: vm.alternate_selling_price
        };
        vm.alternate_unit_grid_data_source = product_product_service.get_alternate_unit_grid_data_source(datasource_data, 250, vm.product_stocking_uom, vm.product_stocking_uom_name);
    };

    const _validate_duplicate_alternate_units = function () {
        let duplicate_unit = false, grid_data = vm.alternate_unit_grid_data_source.data().toJSON();
        if (grid_data.length <= 0) {
            if (vm.alternate_unit.price_type == vm.system_default_price_type &&
                vm.alternate_unit.selling_price_uom_name == vm.product_selling_uom_name) {
                duplicate_unit = true;
            }
        }

        if (vm.alternate_unit.price_type == vm.system_default_price_type &&
            vm.alternate_unit.selling_price_uom_name == vm.product_selling_uom_name) {
            duplicate_unit = true;
            return duplicate_unit;
        }

        for (let i = 0; i < grid_data.length; i++) {
            if (grid_data[i].price_type == vm.alternate_unit.price_type &&
                grid_data[i].selling_price_uom_name == vm.alternate_unit.selling_price_uom_name) {
                duplicate_unit = true;
                break;
            }

        }
        return duplicate_unit;
    };

    const _validate_alternate_unit = function () {
        var is_valid = true;
        if (vm.alternate_unit.selling_multiple === '' || vm.alternate_unit.selling_multiple === null || angular.isUndefined(vm.alternate_unit.selling_multiple)) {
            is_valid = false;
        } else if (vm.alternate_unit.price_method != 0 && (vm.alternate_unit.rounding_method === '' || vm.alternate_unit.rounding_method === null || angular.isUndefined(vm.alternate_unit.rounding_method))) {
            is_valid = false;
        }
            // else if (vm.alternate_unit.price_method != 0 && vm.alternate_unit.rounding_method === '' || vm.alternate_unit.rounding_method === null || angular.isUndefined(vm.alternate_unit.rounding_method)) {
            //     is_valid = false;
        // }
        else if (vm.alternate_unit.price_method == 1) {
            if (vm.alternate_unit.discount_off_retail_percent === '' || vm.alternate_unit.discount_off_retail_percent === null || angular.isUndefined(vm.alternate_unit.discount_off_retail_percent)) {
                is_valid = false;
            }
        } else if (vm.alternate_unit.price_method == 2) {
            if (vm.alternate_unit.markup_from_retail_percent === '' || vm.alternate_unit.markup_from_retail_percent === null || angular.isUndefined(vm.alternate_unit.markup_from_retail_percent)) {
                is_valid = false;
            }
        } else if (vm.alternate_unit.price_method == 0) {
            if (vm.alternate_unit.price === '' || vm.alternate_unit.price === null || angular.isUndefined(vm.alternate_unit.price)) {
                is_valid = false;
            }
        }

        if (is_valid) {
            if (vm.alternate_unit.price_method == 1) {
                vm.alternate_unit.markup_price = vm.alternate_unit.discount_off_retail_percent;
            }

            if (vm.alternate_unit.price_method == 2) {
                vm.alternate_unit.markup_price = vm.alternate_unit.markup_from_retail_percent;
            }
        }
        return is_valid;
    };

    /*
          When adding a new UOm , check for is it existing for default price type if not add one extra for default price type.
     */
    const _check_uom_for_default_price = function () {
        let grid_data = vm.alternate_unit_grid_data_source.data().toJSON();
        let found_default_price_uom = false;
        for (var i = 0; i < grid_data.length; i++) {
            if (grid_data[i].price_type == vm.system_default_price_type) {
                if (grid_data[i].uom == vm.alternate_unit.uom) {
                    found_default_price_uom = true;
                    break;
                }
            }
        }
        return found_default_price_uom;
    };

    /*
        Search and return unique alternaing unit by price type and UOM
     */
    const _search_unique_alternate_unit = function (alternate_units, price_type, uom) {
        let unique_alternate_unit = null;
        for (let i = 0; i < alternate_units.length; i++) {
            if (alternate_units[i].price_type == price_type && alternate_units[i].uom == uom) {
                unique_alternate_unit = alternate_units[i];
                break;
            }
        }
        return unique_alternate_unit;
    };

    /*
        This function adds the previously deleted record back to the grid, if user deleted and tries to add same again.
     */
    const _add_previously_deleted_record = function (alternate_unit) {
        vm.product_copy.item_details.forEach(function (item) {
            if (item.branch === vm.item.branch) {
                item.prices.forEach(function (price) {
                    if (price.default_text === alternate_unit.default_text && price.uom == alternate_unit.uom) {
                        alternate_unit.id = price.id;
                        alternate_unit.product_price = price.product_price;
                    }
                });
            }
        });
    };

    /*
            When a new unit is adding, check if it has been deleted and added again then get the id and assign to newly adding unit.
            This prevents the "server side error - The fields Product Variant, Unit of Measure, Price Type must make a unique set."
     */
    const _check_add_deleted_unit = function (alternate_unit) {
        for (let i = 0; i < vm.deleted_alternate_units.length; i++) {
            if (vm.deleted_alternate_units[i].default_text === alternate_unit.default_text && vm.deleted_alternate_units[i].uom == alternate_unit.uom) {
                alternate_unit.id = vm.deleted_alternate_units[i].id;
                alternate_unit.product_price = vm.deleted_alternate_units[i].product_price;
            }
        }
    };

    const _add_alternate_unit_to_grid = function (adding_multiple, adding_multiple_callback) {
        if (_validate_duplicate_alternate_units()) {
            StdDialog.information('The combination of Price Type and Unit of Measure must make a unique set');
        } else {
            //Validate before adding for same UOM and Price Type. It should not be same as already added.
            vm.alternate_unit.selling_product_amount = vm.alternate_unit.price;
            vm.alternate_unit.product_gross_profit = 0;
            if (vm.alternate_unit.price_method == 0) {
                vm.alternate_unit.markup_price = null;
            }

            if (vm.alternate_unit.price) {
                vm.alternate_unit.product_gross_profit = vm.calculate_gross_profit(vm.alternate_unit.price, vm.alternate_unit.uom, vm.alternate_unit.selling_multiple);
            }
            //Check for default price is existing with adding UOM , if not then add one for default pricing.
            if (_check_uom_for_default_price() || vm.alternate_unit.price_type == vm.system_default_price_type) {
                //If already existing this UOM with default pricing type
                _get_latest_price_gp_percentage(vm.alternate_unit, function (error, response) {
                    if (response) {
                        let calculated_data = response.data[0];
                        vm.alternate_unit.price = calculated_data.alternate_price;
                        vm.alternate_unit.product_gross_profit = calculated_data.gp ? calculated_data.gp : '0';
                        //_check_add_deleted_unit(vm.alternate_unit);
                        //_add_previously_deleted_record(vm.alternate_unit);
                        vm.alternate_unit_grid_data_source.pushCreate(vm.alternate_unit);

                        //Add the alternate unit to grid here
                        _reset_alternate_unit();
                    }
                });

            } else {
                //This UOM is not existing for default pricing so, add one for it.
                let grid_new_records = [], automatically_adding_alternate_unit = angular.copy(vm.alternate_unit);
                automatically_adding_alternate_unit.price_type = vm.system_default_price_type;
                automatically_adding_alternate_unit.default_text = vm.system_default_price_type_name;
                automatically_adding_alternate_unit.default_text = vm.system_default_price_type_name;
                automatically_adding_alternate_unit.price_method = 1;
                automatically_adding_alternate_unit.markup_price = 0.01;
                automatically_adding_alternate_unit.price_method_name = 'Discount Off Retail';
                automatically_adding_alternate_unit.temp_id = Math.floor(1000 + Math.random() * 9000);
                //automatically_adding_alternate_unit.price = ep_decimalFilter((vm.selling_price.amount * vm.alternate_unit.selling_multiple));
                automatically_adding_alternate_unit.rounding_method = 3;
                automatically_adding_alternate_unit.rounding_method_name = "Use Price Rounding Table";

                //add set price
                //add price * Sell Multiple
                //let grid_new_records = [automatically_adding_alternate_unit, vm.alternate_unit];

                if (automatically_adding_alternate_unit.default_text == vm.system_default_price_type_name &&
                    automatically_adding_alternate_unit.uom == vm.product_selling_uom) {
                    //_check_add_deleted_unit(vm.alternate_unit);
                    //_add_previously_deleted_record(vm.alternate_unit);
                    grid_new_records = [vm.alternate_unit];
                } else {
                    // _check_add_deleted_unit(automatically_adding_alternate_unit);
                    // _check_add_deleted_unit(vm.alternate_unit);

                    //_add_previously_deleted_record(automatically_adding_alternate_unit);
                    //_add_previously_deleted_record(vm.alternate_unit);
                    grid_new_records = [automatically_adding_alternate_unit, vm.alternate_unit];
                }

                //update the calculations
                _get_latest_price_gp_percentage(grid_new_records, function (error, response) {
                    if (response) {
                        let calculated_data = response.data;
                        let alternate_unit;
                        for (let i = 0; i < calculated_data.length; i++) {
                            alternate_unit = _search_unique_alternate_unit(grid_new_records, calculated_data[i].price_type_id, calculated_data[i].uom_id);
                            alternate_unit.price = calculated_data[i].alternate_price;
                            alternate_unit.product_gross_profit = calculated_data[i].gp ? calculated_data[i].gp : '0';
                        }
                        vm.alternate_unit_grid_data_source.pushCreate(grid_new_records);

                        //Show a message saying automatically added a alternate unit for default price type.
                        if (grid_new_records.length > 1) {
                            StdDialog.information(`An alternate selling unit has been automatically added for the price type of ${vm.system_default_price_type_name} with a matching unit of measurement and selling multiple as the unit that was just added.`);
                            if (adding_multiple && adding_multiple_callback && typeof adding_multiple_callback === "function") {
                                adding_multiple_callback(grid_new_records.length);
                            }
                        }
                        //Add the alternate unit to grid here
                        _reset_alternate_unit();
                    }
                });
            }
        }
    };

    vm.alternate_unit_add_more_button_clicked = function () {
        if (!_validate_alternate_unit()) {
            vm.alternate_unit_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
        } else if (_validate_duplicate_alternate_units()) {
            vm.alternate_unit_add_dialog.inline_error_message('The combination of Price Type and Unit of Measure must make a unique set', 'Information');
        } else if (!_validate_duplicate_sell_muitple(vm.alternate_unit.uom, vm.alternate_unit.selling_multiple)) {
            vm.alternate_unit_add_dialog.inline_error_message('Duplicate selling multiple for default selling multiple not allowed.');
        } else {
            if (vm.alternate_unit_add_dialog && vm.alternate_unit_add_dialog.remove_inline_error_message) {
                vm.alternate_unit_add_dialog.remove_inline_error_message();
            }
            _add_alternate_unit_to_grid(true, function (add_count) {
                if (add_count > 1) {
                    vm.alternate_unit_add_dialog.inline_error_message(`An alternate selling unit has been automatically added for the price type of ${vm.system_default_price_type_name} with a matching unit of measurement and selling multiple as the unit that was just added.`);
                }
            });
        }
    };

    vm.alternate_unit_add_edit_button_clicked = function () {
        if (!_validate_alternate_unit()) {
            vm.alternate_unit_add_dialog.inline_error_message(util.missing_fields_content, util.missing_fields_title);
        } else if (_validate_duplicate_alternate_units()) {
            vm.alternate_unit_add_dialog.inline_error_message('The combination of Price Type and Unit of Measure must make a unique set', 'Information');
        } else if (!_validate_duplicate_sell_muitple(vm.alternate_unit.uom, vm.alternate_unit.selling_multiple)) {
            vm.alternate_unit_add_dialog.inline_error_message(' Duplicate selling multiple for default selling multiple not allowed.');
        } else {
            vm.alternate_unit_add_dialog.close();
            _add_alternate_unit_to_grid();
        }
    };

    vm.alternate_unit_cancel_button_clicked = function () {
        //reset the object to new fresh
        _reset_alternate_unit();
        vm.alternate_unit_add_dialog.close();
    };

    vm.add_alternate_selling_unit = function () {
        vm.disable_pricing_method_dd = true;

        var buttons = [
            {
                text: "Cancel",
                primary: false,
                callback: vm.alternate_unit_cancel_button_clicked,
                disable_if: "product_controller.item_add_save_and_add_button.submitting || product_controller.item_add_save_and_edit_button.submitting"
            },
            {
                text: "Ok",
                primary: true,
                callback: vm.alternate_unit_add_edit_button_clicked,
                disable_if: "product_controller.item_add_save_and_add_button.submitting"
            },
            {
                text: "Add More",
                primary: false,
                callback: vm.alternate_unit_add_more_button_clicked, //Save and Add more
                disable_if: "product_controller.item_add_save_and_edit_button.submitting"
            }
        ];

        _reset_alternate_unit();

        vm.alternate_unit_add_dialog = StdDialog.custom({
            size: "lg",
            title: "Add New Price or Unit",
            show_title_bar: true,
            templateUrl: 'app/product/product_maintenance/views/templates/product_alternate_price_add.html',
            windowClass: 'ep-alert-override-modal',
            auto_close: false,
            auto_focus: false,
            controller_name: "product_controller",
            scope: $scope,
            icon: "mdi mdi-cube-outline",
            buttons: buttons,
            is_keyboard_support_required: true,
            back_action: vm.alternate_unit_cancel_button_clicked,
            dialog_rendered: 'alternate_unit_dialog_rendered'
        });
    };
    vm.alternate_unit_dialog_rendered = function () {
        vm.focus_price_type = true;
    }

    vm.reset_serialized_dropdown = function(){
        if(vm.product.allow_fractional_qty){
            vm.product.serialization = 1;
        }
    };

    const _get_selected_rows_for_delete = function () {
        let grid = $("#alternate_unit_grid").data('kendoGrid');
        let rows = grid.select(), dataItem, selected_rows_data = [];
        rows.each(function (e) {
            dataItem = grid.dataItem(this);
            selected_rows_data.push(dataItem);
        });
        return selected_rows_data;
    };

    const _is_selected_for_delete = function (data_item) {
        let selected_data_for_delete = _get_selected_rows_for_delete();
        let is_selected = false;
        for (let i = 0; i < selected_data_for_delete.length; i++) {
            if (selected_data_for_delete[i].price_type == data_item.price_type && selected_data_for_delete[i].uom == data_item.uom) {
                is_selected = true;
                break;
            }
        }
        return is_selected;
    };

    const _check_default_price_uom = function (removing_item) {
        let grid_data = vm.alternate_unit_grid_data_source.data().toJSON();
        let found_default_price_type = false;
        for (let i = 0; i < grid_data.length; i++) {
            if (grid_data[i].price_type != vm.system_default_price_type && grid_data[i].uom == removing_item.uom && !_is_selected_for_delete(grid_data[i])) {
                found_default_price_type = true;
                break;
            }
        }
        return found_default_price_type;
    };

    const _can_delete_default_price_type = function () {
        const selected_row_indexes = _get_selected_row_index();
        let removing_row, uid, found_default_with_uom = false;
        for (let i = 0; i < selected_row_indexes.length; i++) {
            uid = selected_row_indexes[i];
            removing_row = vm.alternate_unit_grid_data_source.getByUid(uid);
            if (removing_row.price_type == vm.system_default_price_type) {
                found_default_with_uom = _check_default_price_uom(removing_row);
                break;
            }
        }
        return found_default_with_uom;
    };

    const _delete_record_in_other_branches = function (removing_row, row_id) {
        let items = vm.product.item_details;
        let product_price = 'product_price';
        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items[i].prices.length; j++) {
                product_price = items[i].prices[j].product_price ? 'product_price' : 'temp_id';
                if (!items[i].prices[j].is_default && items[i].prices[j][product_price] === row_id) {
                    vm.deleted_alternate_units.push(items[i].prices[j]);
                    _manage_deleted_alternate_units(items[i].branch, items[i].prices[j]);
                    items[i].prices.splice(j, 1);
                }
            }
        }
    };

    const _manage_deleted_alternate_units = function (store_id, deleted_au_record) {
        if (!vm.delete_au_map[store_id]) {
            vm.delete_au_map[store_id] = {
                'au_records': [deleted_au_record]
            };
        } else {
            vm.delete_au_map[store_id].au_records.push(deleted_au_record);
        }
    };

    vm.delete_alternate_selling_unit = function () {
        var delete_question_answered = function (answer) {
            if (answer) {
                const selected_row_indexes = _get_selected_row_index();
                let removing_row, uid;
                let product_price;
                for (let i = 0; i < selected_row_indexes.length; i++) {
                    uid = selected_row_indexes[i];
                    removing_row = vm.alternate_unit_grid_data_source.getByUid(uid);
                    if (removing_row.id) {
                        _manage_deleted_alternate_units(vm.item.branch, removing_row);
                        vm.deleted_alternate_units.push(removing_row); //maintaining a array 0f deleted units to add it later when price type and UOM is same.
                    }
                    vm.alternate_unit_grid_data_source.remove(removing_row);
                    //also, delete same item for all other stores
                    product_price = removing_row.product_price ? 'product_price' : 'temp_id';
                    _delete_record_in_other_branches(removing_row, removing_row[product_price]);

                    //Disable the delet button after delete
                    $timeout(function () {
                        vm.is_actions_toolbar_buttons_enabled = false;
                    }, 500);
                }
            }
        };

        if (_can_delete_default_price_type()) {
            StdDialog.information('An alternate selling unit for the default price type cannot be deleted when other alternates exists for the same Sell UOM with a different Price Type. <br> <br> For instance, if your default Price Type is "Retail" and you have an alternate selling unit of case for more than one Price Type, there must be an instance of this alternate selling unit with Price Type of Retail.');
        } else {
            StdDialog.informational_alert({
                text: "The selected Alternative Prices/Units will be deleted, continue?",
                title: "Are You Sure",
                callback: delete_question_answered,
                scope: $scope,
                continue_text: "Yes",
                cancel_text: "No",
                default_focus_on: 'no'
            });
        }
    };

    /*
        Get selected row indexes from alternate unit grid.
     */
    const _get_selected_row_index = function () {
        const grid = $("#alternate_unit_grid").data('kendoGrid');
        let currentSelection = grid.select();
        let selectedRows = [], row, row_uid;
        currentSelection.each(function () {
            row = $(this).closest("tr");
            row_uid = $(row).attr('data-uid');
            let currentRowIndex = row.index();
            if (selectedRows.indexOf(currentRowIndex) < 0) {
                selectedRows.push(row_uid);
            }
        });
        return selectedRows;
    };

    /*
       End of Alternate selling unit code.
     */

    /*
            Formats the notes in the format required by API.
     */
    const _format_notes = function () {
        let each_note = {
            product_note: {}
        };
        vm.product_notes = angular.copy(vm.product.product_notes);
        vm.product.product_notes = [];
        vm.product_notes.forEach(function (note) {
            if (note.added_temp_id) {
                delete note.id;
            }

            each_note = {
                product_note: note
            };
            vm.product.product_notes.push(each_note);
        });
    };

    const _format_location_codes = function () {
        let location_codes = angular.copy(vm.item.stocking.bin_locations);
        angular.forEach(location_codes, function (location) {
            if (location.new_location_code)
                delete location.id;
        });
        vm.item.stocking.bin_locations = location_codes;
    };


    const _save_bin_locations = function (codes) {
        vm.item.stocking.bin_locations = codes.toJSON();
    };

    vm.location_code_maintenance = async function () {

        const _caller_data = {
            "location_codes": angular.copy(vm.item.stocking.bin_locations),
            "save_bin_locations": _save_bin_locations
        };

        await StdDialog.lastOpenedDialog().closed;
        vm.location_code_maintenance_dialog = StdDialog.custom({
            controller_name: 'location_code_maintenance_controller',
            scope: $scope,
            create_controller_and_scope: true,
            configure_from_new_controller: true,
            is_keyboard_support_required: true,
            caller_data: _caller_data
        });

    };

    $scope.$on('product_data_changed', function (evnt, args) {
        if (vm.product_data_loaded) {
            $scope.$broadcast('product_record_changed', vm.product);
        }
    });

    $scope.$on('serial_num_grid_loaded', function (event, args) {
        vm.serial_number_grid_loaded_flag = true;
    });


    init();
};

