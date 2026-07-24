#import <Cocoa/Cocoa.h>

@interface DragoTableApp : NSObject <NSApplicationDelegate, NSWindowDelegate>
@property NSWindow *window;
@property NSTextField *statusLabel;
@property NSButton *dmButton;
@property NSButton *playerButton;
@property NSTask *hostTask;
@property NSFileHandle *logHandle;
@property NSTimer *healthTimer;
@end

@implementation DragoTableApp

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    [self configureMenu];
    [self configureWindow];
    [NSApp activateIgnoringOtherApps:YES];
    [self startHost];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)notification {
    [self.healthTimer invalidate];
    if (self.hostTask.running) {
        [self.hostTask terminate];
        [self.hostTask waitUntilExit];
    }
    [self.logHandle closeFile];
}

- (BOOL)windowShouldClose:(NSWindow *)sender {
    [NSApp terminate:nil];
    return NO;
}

- (void)configureMenu {
    NSMenu *mainMenu = [NSMenu new];
    NSMenuItem *appMenuItem = [NSMenuItem new];
    NSMenu *appMenu = [NSMenu new];
    [appMenu addItemWithTitle:@"Quit Drago Table"
                       action:@selector(terminate:)
                keyEquivalent:@"q"];
    appMenuItem.submenu = appMenu;
    [mainMenu addItem:appMenuItem];
    NSApp.mainMenu = mainMenu;
}

- (NSTextField *)label:(NSString *)text size:(CGFloat)size weight:(NSFontWeight)weight {
    NSTextField *label = [NSTextField labelWithString:text];
    label.font = [NSFont systemFontOfSize:size weight:weight];
    label.alignment = NSTextAlignmentCenter;
    return label;
}

- (void)configureWindow {
    self.window = [[NSWindow alloc]
        initWithContentRect:NSMakeRect(0, 0, 460, 260)
                  styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable
                    backing:NSBackingStoreBuffered
                      defer:NO];
    self.window.title = @"Drago Table";
    self.window.delegate = self;
    [self.window center];

    NSTextField *title = [self label:@"Drago Table" size:28 weight:NSFontWeightBold];
    NSTextField *subtitle = [self label:@"Your campaign, hosted on this Mac" size:14 weight:NSFontWeightRegular];
    subtitle.textColor = NSColor.secondaryLabelColor;

    self.statusLabel = [self label:@"Starting local services…" size:13 weight:NSFontWeightMedium];

    self.dmButton = [NSButton buttonWithTitle:@"Open Dungeon Master"
                                       target:self
                                       action:@selector(openDM:)];
    self.playerButton = [NSButton buttonWithTitle:@"Open Player View"
                                           target:self
                                           action:@selector(openPlayer:)];
    NSButton *stopButton = [NSButton buttonWithTitle:@"Stop Drago Table"
                                              target:self
                                              action:@selector(stopApp:)];
    self.dmButton.enabled = NO;
    self.playerButton.enabled = NO;

    NSStackView *buttonRow = [NSStackView stackViewWithViews:@[self.dmButton, self.playerButton]];
    buttonRow.orientation = NSUserInterfaceLayoutOrientationHorizontal;
    buttonRow.spacing = 10;
    buttonRow.distribution = NSStackViewDistributionFillEqually;

    NSStackView *stack = [NSStackView stackViewWithViews:@[
        title, subtitle, self.statusLabel, buttonRow, stopButton
    ]];
    stack.orientation = NSUserInterfaceLayoutOrientationVertical;
    stack.spacing = 14;
    stack.alignment = NSLayoutAttributeCenterX;
    stack.translatesAutoresizingMaskIntoConstraints = NO;

    [self.window.contentView addSubview:stack];
    [NSLayoutConstraint activateConstraints:@[
        [stack.leadingAnchor constraintEqualToAnchor:self.window.contentView.leadingAnchor constant:28],
        [stack.trailingAnchor constraintEqualToAnchor:self.window.contentView.trailingAnchor constant:-28],
        [stack.centerYAnchor constraintEqualToAnchor:self.window.contentView.centerYAnchor],
        [buttonRow.widthAnchor constraintEqualToAnchor:stack.widthAnchor],
        [stopButton.widthAnchor constraintEqualToConstant:180],
    ]];
    [self.window makeKeyAndOrderFront:nil];
}

- (NSString *)requestPassword {
    NSSecureTextField *password = [[NSSecureTextField alloc] initWithFrame:NSMakeRect(0, 0, 280, 24)];
    NSSecureTextField *confirmation = [[NSSecureTextField alloc] initWithFrame:NSMakeRect(0, 0, 280, 24)];
    password.placeholderString = @"Dungeon Master password";
    confirmation.placeholderString = @"Confirm password";

    NSStackView *fields = [NSStackView stackViewWithViews:@[password, confirmation]];
    fields.orientation = NSUserInterfaceLayoutOrientationVertical;
    fields.spacing = 8;

    NSAlert *alert = [NSAlert new];
    alert.messageText = @"Set Up Drago Table";
    alert.informativeText = @"Choose the password used to open the Dungeon Master interface.";
    alert.accessoryView = fields;
    [alert addButtonWithTitle:@"Continue"];
    [alert addButtonWithTitle:@"Cancel"];

    if ([alert runModal] != NSAlertFirstButtonReturn) return nil;
    if (password.stringValue.length == 0 ||
        ![password.stringValue isEqualToString:confirmation.stringValue]) {
        NSAlert *mismatch = [NSAlert new];
        mismatch.messageText = @"Passwords did not match";
        mismatch.informativeText = @"Open Drago Table and try again.";
        [mismatch runModal];
        return nil;
    }
    return password.stringValue;
}

- (void)startHost {
    NSURL *resources = NSBundle.mainBundle.resourceURL;
    NSURL *repositoryFile = [resources URLByAppendingPathComponent:@"repository-path"];
    NSError *error = nil;
    NSString *repository = [NSString stringWithContentsOfURL:repositoryFile
                                                   encoding:NSUTF8StringEncoding
                                                      error:&error];
    repository = [repository stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet];
    if (error || repository.length == 0) {
        [self showFatal:@"The repository location is missing. Reinstall the Desktop app."];
        return;
    }

    NSString *launcher = [repository stringByAppendingPathComponent:@"scripts/drago-table"];
    if (![NSFileManager.defaultManager isExecutableFileAtPath:launcher]) {
        [self showFatal:@"The local launcher could not be found. Reinstall the Desktop app."];
        return;
    }

    NSURL *home = [NSFileManager.defaultManager.homeDirectoryForCurrentUser
        URLByAppendingPathComponent:@"Library/Application Support/Drago Table"];
    NSURL *logs = [home URLByAppendingPathComponent:@"logs"];
    NSURL *config = [home URLByAppendingPathComponent:@"config.json"];
    [NSFileManager.defaultManager createDirectoryAtURL:logs
                            withIntermediateDirectories:YES
                                             attributes:nil
                                                  error:&error];
    if (error) {
        [self showFatal:@"Drago Table could not create its private log directory."];
        return;
    }

    NSMutableDictionary *environment = [NSProcessInfo.processInfo.environment mutableCopy];
    if (![NSFileManager.defaultManager fileExistsAtPath:config.path]) {
        NSString *password = [self requestPassword];
        if (!password) {
            [NSApp terminate:nil];
            return;
        }
        environment[@"DRAGO_TABLE_ADMIN_PASSWORD"] = password;
    }

    NSURL *logURL = [logs URLByAppendingPathComponent:@"desktop-launcher.log"];
    if (![NSFileManager.defaultManager fileExistsAtPath:logURL.path]) {
        [NSFileManager.defaultManager createFileAtPath:logURL.path contents:nil attributes:nil];
    }
    self.logHandle = [NSFileHandle fileHandleForWritingAtPath:logURL.path];
    [self.logHandle seekToEndOfFile];

    self.hostTask = [NSTask new];
    self.hostTask.executableURL = [NSURL fileURLWithPath:@"/usr/bin/arch"];
    self.hostTask.arguments = @[@"-arm64", launcher, @"--skip-build", @"--no-browser"];
    self.hostTask.environment = environment;
    self.hostTask.standardOutput = self.logHandle;
    self.hostTask.standardError = self.logHandle;

    __weak DragoTableApp *weakSelf = self;
    self.hostTask.terminationHandler = ^(NSTask *task) {
        dispatch_async(dispatch_get_main_queue(), ^{
            DragoTableApp *strongSelf = weakSelf;
            if (!strongSelf) return;
            [strongSelf.healthTimer invalidate];
            if (task.terminationStatus != 0) {
                [strongSelf showFatal:
                    @"The local host stopped before it was ready. Details are in "
                     "~/Library/Application Support/Drago Table/logs/desktop-launcher.log"];
            }
        });
    };

    if (![self.hostTask launchAndReturnError:&error]) {
        [self showFatal:@"Drago Table could not start its local host."];
        return;
    }

    self.healthTimer = [NSTimer scheduledTimerWithTimeInterval:0.5
                                                       target:self
                                                     selector:@selector(checkHealth:)
                                                     userInfo:nil
                                                      repeats:YES];
}

- (void)checkHealth:(NSTimer *)timer {
    NSMutableURLRequest *request = [NSMutableURLRequest
        requestWithURL:[NSURL URLWithString:@"http://127.0.0.1:8010/api/health"]];
    request.timeoutInterval = 0.4;
    __weak DragoTableApp *weakSelf = self;
    [[NSURLSession.sharedSession dataTaskWithRequest:request
                                  completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        NSHTTPURLResponse *http = (NSHTTPURLResponse *)response;
        if (error || http.statusCode != 200 || !data) return;
        dispatch_async(dispatch_get_main_queue(), ^{
            DragoTableApp *strongSelf = weakSelf;
            if (!strongSelf) return;
            [strongSelf.healthTimer invalidate];
            strongSelf.statusLabel.stringValue = @"Ready — available on this Mac";
            strongSelf.statusLabel.textColor = NSColor.systemGreenColor;
            strongSelf.dmButton.enabled = YES;
            strongSelf.playerButton.enabled = YES;
        });
    }] resume];
}

- (NSURL *)dmURL {
    return [NSURL URLWithString:@"http://127.0.0.1:8010/"];
}

- (NSURL *)playerURL {
    return [NSURL URLWithString:@"http://127.0.0.1:8010/portal"];
}

- (void)openDM:(id)sender {
    [NSWorkspace.sharedWorkspace openURL:self.dmURL];
}

- (void)openPlayer:(id)sender {
    [NSWorkspace.sharedWorkspace openURL:self.playerURL];
}

- (void)stopApp:(id)sender {
    [NSApp terminate:nil];
}

- (void)showFatal:(NSString *)message {
    self.statusLabel.stringValue = @"Unable to start";
    self.statusLabel.textColor = NSColor.systemRedColor;
    NSAlert *alert = [NSAlert new];
    alert.messageText = @"Drago Table could not start";
    alert.informativeText = message;
    [alert runModal];
}

@end

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        NSApplication *application = NSApplication.sharedApplication;
        DragoTableApp *delegate = [DragoTableApp new];
        application.delegate = delegate;
        [application setActivationPolicy:NSApplicationActivationPolicyRegular];
        [application run];
    }
    return 0;
}
