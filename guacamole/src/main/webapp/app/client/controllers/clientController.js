/*
 * Copyright (C) 2014 Glyptodon LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*
 * In order to open the guacamole menu, we need to hit ctrl-alt-shift. There are
 * several possible keysysms for each key.
 */

var SHIFT_KEYS  = {0xFFE1 : true, 0xFFE2: true},
    ALT_KEYS    = {0xFFE9 : true, 0xFFEA : true, 0xFE03: true},
    CTRL_KEYS   = {0xFFE3 : true, 0xFFE4: true},
    MENU_KEYS   = angular.extend({}, SHIFT_KEYS, ALT_KEYS, CTRL_KEYS);

/**
 * The controller for the page used to connect to a connection or balancing group.
 */
angular.module('home').controller('clientController', ['$scope', '$routeParams', 'localStorageUtility', '$injector',
        function clientController($scope, $routeParams, localStorageUtility, $injector) {
      
    // Get DAO for reading connections and groups
    var connectionGroupDAO = $injector.get('connectionGroupDAO');
    var connectionDAO      = $injector.get('connectionDAO');

    // Client settings and state
    $scope.clientParameters = {scale: 1};
    
    // Hide menu by default
    $scope.menuShown        = false;
    $scope.menuHasBeenShown = false;
            
    /*
     * Parse the type, name, and id out of the url paramteres, 
     * as well as any extra parameters if set.
     */
    $scope.type                 = $routeParams.type;
    $scope.id                   = $routeParams.id;
    $scope.connectionParameters = $routeParams.params || '';

    // Keep title in sync with connection state
    $scope.$watch('connectionName', function updateTitle() {
        $scope.page.title = $scope.connectionName;
    });

    // Pull connection name from server
    switch ($scope.type) {

        // Connection
        case 'c':
            connectionDAO.getConnection($scope.id).success(function (connection) {
                $scope.connectionName = connection.name;
            });
            break;

        // Connection group
        case 'g':
            connectionGroupDAO.getConnectionGroup($scope.id).success(function (group) {
                $scope.connectionName = group.name;
            });
            break;

    }

    var keysCurrentlyPressed = {};

    /*
     * Check to see if all currently pressed keys are in the set of menu keys.
     */  
    function checkMenuModeActive() {
        for(var keysym in keysCurrentlyPressed) {
            if(!MENU_KEYS[keysym]) {
                return false;
            }
        }
        
        return true;
    }
    
    $scope.$on('guacKeydown', function keydownListener(event, keysym, keyboard) {
        keysCurrentlyPressed[keysym] = true;
    });

    // Listen for broadcasted keyup events and fire the appropriate listeners
    $scope.$on('guacKeyup', function keyupListener(event, keysym, keyboard) {
        /* 
         * If only menu keys are pressed, and we have one keysym from each group,
         * and one of the keys is being released, show the menu. 
         */
        if(checkMenuModeActive()) {
            var currentKeysPressedKeys = Object.keys(keysCurrentlyPressed);
            
            // Check that there is a key pressed for each of the required key classes
            if(!_.isEmpty(_.pick(SHIFT_KEYS, currentKeysPressedKeys)) &&
               !_.isEmpty(_.pick(ALT_KEYS, currentKeysPressedKeys)) &&
               !_.isEmpty(_.pick(CTRL_KEYS, currentKeysPressedKeys))
            ) {
        
                // Toggle the menu
                $scope.safeApply(function() {
                    $scope.menuShown = !$scope.menuShown;
                    
                    // The menu has been shown at least once before
                    $scope.menuHasBeenShown = true;
                });
                
                // Reset the keys pressed
                keysCurrentlyPressed = {};
            }
        }
        
        delete keysCurrentlyPressed[keysym];
    });
    
}]);
