#import <Cocoa/Cocoa.h>

@interface DragoTableApp : NSObject <NSApplicationDelegate, NSWindowDelegate>
@property NSWindow *window;
@property NSTextField *statusLabel;
@property NSTextField *remoteStatusLabel;
@property NSView *remoteIndicator;
@property NSButton *dmButton;
@property NSButton *playerButton;
@property NSButton *remoteButton;
@property NSButton *inviteButton;
@property NSTask *hostTask;
@property NSTask *tunnelTask;
@property NSFileHandle *logHandle;
@property NSFileHandle *tunnelLogHandle;
@property NSTimer *healthTimer;
@property NSTimer *remoteHealthTimer;
@property NSString *remoteHostname;
@property NSString *tunnelID;
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
    [self.remoteHealthTimer invalidate];
    [self stopTunnel];
    if (self.hostTask.running) {
        [self.hostTask terminate];
        [self.hostTask waitUntilExit];
    }
    [self.logHandle closeFile];
    [self.tunnelLogHandle closeFile];
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

- (NSView *)statusCardWithTitle:(NSString *)title
                         detail:(NSTextField *)detail
                          color:(NSColor *)color {
    NSView *card = [NSView new];
    card.wantsLayer = YES;
    card.layer.backgroundColor = [NSColor colorWithWhite:0.98 alpha:1].CGColor;
    card.layer.cornerRadius = 10;
    card.layer.borderWidth = 1;
    card.layer.borderColor = [NSColor colorWithWhite:0.84 alpha:1].CGColor;

    NSView *indicator = [NSView new];
    indicator.wantsLayer = YES;
    indicator.layer.backgroundColor = color.CGColor;
    indicator.layer.cornerRadius = 5;
    indicator.translatesAutoresizingMaskIntoConstraints = NO;
    if ([title isEqualToString:@"Remote players"]) self.remoteIndicator = indicator;

    NSTextField *heading = [NSTextField labelWithString:title];
    heading.font = [NSFont systemFontOfSize:13 weight:NSFontWeightSemibold];

    detail.font = [NSFont systemFontOfSize:12 weight:NSFontWeightRegular];
    detail.textColor = NSColor.secondaryLabelColor;
    detail.lineBreakMode = NSLineBreakByTruncatingTail;

    NSStackView *text = [NSStackView stackViewWithViews:@[heading, detail]];
    text.orientation = NSUserInterfaceLayoutOrientationVertical;
    text.alignment = NSLayoutAttributeLeading;
    text.spacing = 2;
    text.translatesAutoresizingMaskIntoConstraints = NO;
    [card addSubview:indicator];
    [card addSubview:text];
    [NSLayoutConstraint activateConstraints:@[
        [card.heightAnchor constraintEqualToConstant:58],
        [indicator.leadingAnchor constraintEqualToAnchor:card.leadingAnchor constant:16],
        [indicator.centerYAnchor constraintEqualToAnchor:card.centerYAnchor],
        [indicator.widthAnchor constraintEqualToConstant:10],
        [indicator.heightAnchor constraintEqualToConstant:10],
        [text.leadingAnchor constraintEqualToAnchor:indicator.trailingAnchor constant:12],
        [text.trailingAnchor constraintEqualToAnchor:card.trailingAnchor constant:-16],
        [text.centerYAnchor constraintEqualToAnchor:card.centerYAnchor],
    ]];
    return card;
}

- (void)configureWindow {
    self.window = [[NSWindow alloc]
        initWithContentRect:NSMakeRect(0, 0, 520, 440)
                  styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable
                    backing:NSBackingStoreBuffered
                      defer:NO];
    self.window.title = @"Drago Table";
    self.window.delegate = self;
    [self.window center];

    NSImageView *icon = [[NSImageView alloc] initWithFrame:NSMakeRect(0, 0, 62, 62)];
    icon.image = NSApp.applicationIconImage;
    icon.imageScaling = NSImageScaleProportionallyUpOrDown;
    [icon.widthAnchor constraintEqualToConstant:62].active = YES;
    [icon.heightAnchor constraintEqualToConstant:62].active = YES;

    NSTextField *title = [self label:@"Drago Table" size:27 weight:NSFontWeightBold];
    NSTextField *subtitle = [self label:@"Your campaign, hosted securely on this Mac" size:14 weight:NSFontWeightRegular];
    subtitle.textColor = NSColor.secondaryLabelColor;

    self.statusLabel = [NSTextField labelWithString:@"Starting local services…"];
    self.remoteStatusLabel = [NSTextField labelWithString:@"Remote access is off"];

    self.dmButton = [NSButton buttonWithTitle:@"Open Dungeon Master"
                                       target:self
                                       action:@selector(openDM:)];
    self.playerButton = [NSButton buttonWithTitle:@"Open Player View"
                                           target:self
                                           action:@selector(openPlayer:)];
    self.remoteButton = [NSButton buttonWithTitle:@"Start Remote Session"
                                           target:self
                                           action:@selector(toggleRemote:)];
    self.remoteButton.bezelStyle = NSBezelStyleRounded;
    self.remoteButton.keyEquivalent = @"\r";
    self.inviteButton = [NSButton buttonWithTitle:@"Copy Player Invite"
                                               target:self
                                               action:@selector(copyInvite:)];
    NSButton *stopButton = [NSButton buttonWithTitle:@"Stop Drago Table"
                                              target:self
                                              action:@selector(stopApp:)];
    self.dmButton.enabled = NO;
    self.playerButton.enabled = NO;
    self.remoteButton.enabled = NO;
    self.inviteButton.enabled = NO;

    NSStackView *buttonRow = [NSStackView stackViewWithViews:@[self.dmButton, self.playerButton]];
    buttonRow.orientation = NSUserInterfaceLayoutOrientationHorizontal;
    buttonRow.spacing = 10;
    buttonRow.distribution = NSStackViewDistributionFillEqually;

    NSStackView *remoteRow = [NSStackView stackViewWithViews:@[
        self.remoteButton, self.inviteButton
    ]];
    remoteRow.orientation = NSUserInterfaceLayoutOrientationHorizontal;
    remoteRow.spacing = 10;
    remoteRow.distribution = NSStackViewDistributionFillEqually;

    NSView *localCard = [self statusCardWithTitle:@"On this Mac"
                                          detail:self.statusLabel
                                           color:NSColor.systemGreenColor];
    NSView *remoteCard = [self statusCardWithTitle:@"Remote players"
                                           detail:self.remoteStatusLabel
                                            color:NSColor.systemGrayColor];

    NSStackView *stack = [NSStackView stackViewWithViews:@[
        icon, title, subtitle, localCard, buttonRow, remoteCard, remoteRow, stopButton
    ]];
    stack.orientation = NSUserInterfaceLayoutOrientationVertical;
    stack.spacing = 11;
    stack.alignment = NSLayoutAttributeCenterX;
    stack.translatesAutoresizingMaskIntoConstraints = NO;

    [self.window.contentView addSubview:stack];
    [NSLayoutConstraint activateConstraints:@[
        [stack.leadingAnchor constraintEqualToAnchor:self.window.contentView.leadingAnchor constant:28],
        [stack.trailingAnchor constraintEqualToAnchor:self.window.contentView.trailingAnchor constant:-28],
        [stack.centerYAnchor constraintEqualToAnchor:self.window.contentView.centerYAnchor],
        [localCard.widthAnchor constraintEqualToAnchor:stack.widthAnchor],
        [remoteCard.widthAnchor constraintEqualToAnchor:stack.widthAnchor],
        [buttonRow.widthAnchor constraintEqualToAnchor:stack.widthAnchor],
        [remoteRow.widthAnchor constraintEqualToAnchor:stack.widthAnchor],
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
            strongSelf.dmButton.enabled = YES;
            strongSelf.playerButton.enabled = YES;
            strongSelf.remoteButton.enabled = YES;
        });
    }] resume];
}

- (NSURL *)dmURL {
    return [NSURL URLWithString:@"http://127.0.0.1:8010/"];
}

- (NSURL *)playerURL {
    return [NSURL URLWithString:@"http://127.0.0.1:8010/portal"];
}

- (NSURL *)remotePlayerURL {
    return [NSURL URLWithString:[NSString stringWithFormat:@"https://%@/portal", self.remoteHostname]];
}

- (void)openDM:(id)sender {
    [NSWorkspace.sharedWorkspace openURL:self.dmURL];
}

- (void)openPlayer:(id)sender {
    [NSWorkspace.sharedWorkspace openURL:self.playerURL];
}

- (NSString *)cloudflaredPath {
    NSArray<NSString *> *candidates = @[
        @"/opt/homebrew/bin/cloudflared",
        @"/usr/local/bin/cloudflared"
    ];
    for (NSString *candidate in candidates) {
        if ([NSFileManager.defaultManager isExecutableFileAtPath:candidate]) return candidate;
    }
    return nil;
}

- (BOOL)loadRemoteConfiguration {
    NSURL *url = [NSBundle.mainBundle.resourceURL URLByAppendingPathComponent:@"RemoteSession.json"];
    NSData *data = [NSData dataWithContentsOfURL:url];
    if (!data) return NO;
    NSDictionary *configuration = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    self.remoteHostname = configuration[@"hostname"];
    self.tunnelID = configuration[@"tunnel_id"];
    return self.remoteHostname.length > 0 && self.tunnelID.length > 0;
}

- (void)toggleRemote:(id)sender {
    if (self.tunnelTask.running) {
        [self stopTunnel];
        self.remoteStatusLabel.stringValue = @"Remote access is off";
        self.remoteIndicator.layer.backgroundColor = NSColor.systemGrayColor.CGColor;
        self.remoteButton.title = @"Start Remote Session";
        self.inviteButton.enabled = NO;
        return;
    }
    [self startTunnel];
}

- (void)startTunnel {
    if (![self loadRemoteConfiguration]) {
        [self showRemoteError:@"The remote-session configuration is missing. Reinstall Drago Table."];
        return;
    }
    NSString *cloudflared = [self cloudflaredPath];
    if (!cloudflared) {
        [self showRemoteError:@"Cloudflare Tunnel is not installed on this Mac."];
        return;
    }

    NSString *credentials = [NSString stringWithFormat:@"%@/.cloudflared/%@.json",
                                                       NSHomeDirectory(), self.tunnelID];
    if (![NSFileManager.defaultManager isReadableFileAtPath:credentials]) {
        [self showRemoteError:@"The Drago Table tunnel credentials are missing from this Mac."];
        return;
    }

    NSURL *home = [NSFileManager.defaultManager.homeDirectoryForCurrentUser
        URLByAppendingPathComponent:@"Library/Application Support/Drago Table"];
    NSURL *logs = [home URLByAppendingPathComponent:@"logs"];
    NSURL *configurationURL = [home URLByAppendingPathComponent:@"remote-tunnel.yml"];
    NSString *configuration = [NSString stringWithFormat:
        @"tunnel: %@\ncredentials-file: \"%@\"\n\ningress:\n"
         "  - hostname: %@\n    service: http://127.0.0.1:8010\n"
         "  - service: http_status:404\n",
        self.tunnelID, credentials, self.remoteHostname];
    NSError *error = nil;
    if (![configuration writeToURL:configurationURL
                        atomically:YES
                          encoding:NSUTF8StringEncoding
                             error:&error]) {
        [self showRemoteError:@"Drago Table could not prepare its private tunnel configuration."];
        return;
    }
    [NSFileManager.defaultManager setAttributes:@{NSFilePosixPermissions: @0600}
                                    ofItemAtPath:configurationURL.path
                                           error:nil];

    NSURL *logURL = [logs URLByAppendingPathComponent:@"remote-tunnel.log"];
    if (![NSFileManager.defaultManager fileExistsAtPath:logURL.path]) {
        [NSFileManager.defaultManager createFileAtPath:logURL.path contents:nil attributes:nil];
    }
    self.tunnelLogHandle = [NSFileHandle fileHandleForWritingAtPath:logURL.path];
    [self.tunnelLogHandle seekToEndOfFile];

    self.tunnelTask = [NSTask new];
    self.tunnelTask.executableURL = [NSURL fileURLWithPath:@"/usr/bin/arch"];
    self.tunnelTask.arguments = @[
        @"-arm64", cloudflared, @"--config", configurationURL.path,
        @"tunnel", @"run", self.tunnelID
    ];
    self.tunnelTask.standardOutput = self.tunnelLogHandle;
    self.tunnelTask.standardError = self.tunnelLogHandle;

    __weak DragoTableApp *weakSelf = self;
    self.tunnelTask.terminationHandler = ^(NSTask *task) {
        dispatch_async(dispatch_get_main_queue(), ^{
            DragoTableApp *strongSelf = weakSelf;
            if (!strongSelf) return;
            [strongSelf.remoteHealthTimer invalidate];
            if ([strongSelf.remoteButton.title isEqualToString:@"Stop Remote Session"]) {
                strongSelf.remoteStatusLabel.stringValue = @"Remote connection stopped";
                strongSelf.remoteIndicator.layer.backgroundColor =
                    NSColor.systemRedColor.CGColor;
                strongSelf.remoteButton.title = @"Start Remote Session";
                strongSelf.inviteButton.enabled = NO;
            }
        });
    };

    if (![self.tunnelTask launchAndReturnError:&error]) {
        [self showRemoteError:@"Drago Table could not start the Cloudflare connection."];
        return;
    }
    self.remoteStatusLabel.stringValue = @"Connecting securely…";
    self.remoteIndicator.layer.backgroundColor = NSColor.systemOrangeColor.CGColor;
    self.remoteButton.enabled = NO;
    self.remoteHealthTimer = [NSTimer scheduledTimerWithTimeInterval:1
                                                             target:self
                                                           selector:@selector(checkRemoteHealth:)
                                                           userInfo:nil
                                                            repeats:YES];
}

- (void)checkRemoteHealth:(NSTimer *)timer {
    NSMutableURLRequest *request = [NSMutableURLRequest
        requestWithURL:[NSURL URLWithString:
            [NSString stringWithFormat:@"https://%@/api/health", self.remoteHostname]]];
    request.timeoutInterval = 1;
    __weak DragoTableApp *weakSelf = self;
    [[NSURLSession.sharedSession dataTaskWithRequest:request
                                  completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        NSHTTPURLResponse *http = (NSHTTPURLResponse *)response;
        if (error || http.statusCode != 200 || !data) return;
        dispatch_async(dispatch_get_main_queue(), ^{
            DragoTableApp *strongSelf = weakSelf;
            if (!strongSelf) return;
            [strongSelf.remoteHealthTimer invalidate];
            strongSelf.remoteStatusLabel.stringValue =
                [NSString stringWithFormat:@"Live at %@", strongSelf.remoteHostname];
            strongSelf.remoteIndicator.layer.backgroundColor =
                NSColor.systemGreenColor.CGColor;
            strongSelf.remoteButton.title = @"Stop Remote Session";
            strongSelf.remoteButton.enabled = YES;
            strongSelf.inviteButton.enabled = YES;
        });
    }] resume];
}

- (void)copyInvite:(id)sender {
    NSString *invite = self.remotePlayerURL.absoluteString;
    NSPasteboard *pasteboard = NSPasteboard.generalPasteboard;
    [pasteboard clearContents];
    [pasteboard setString:invite forType:NSPasteboardTypeString];
    self.remoteStatusLabel.stringValue = @"Player invite copied";
}

- (void)stopTunnel {
    [self.remoteHealthTimer invalidate];
    if (self.tunnelTask.running) {
        [self.tunnelTask terminate];
        [self.tunnelTask waitUntilExit];
    }
}

- (void)showRemoteError:(NSString *)message {
    self.remoteStatusLabel.stringValue = @"Unable to start remote access";
    self.remoteIndicator.layer.backgroundColor = NSColor.systemRedColor.CGColor;
    self.remoteButton.enabled = YES;
    NSAlert *alert = [NSAlert new];
    alert.messageText = @"Remote session could not start";
    alert.informativeText = message;
    [alert runModal];
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
