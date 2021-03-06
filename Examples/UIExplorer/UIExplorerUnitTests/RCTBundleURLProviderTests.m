/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
#import <XCTest/XCTest.h>

#import "RCTBundleURLProvider.h"
#import "RCTUtils.h"


static NSString *const testFile = @"test.jsbundle";
static NSString *const mainBundle = @"main.jsbundle";

static NSURL *mainBundleURL()
{
  return [[[NSBundle mainBundle] bundleURL] URLByAppendingPathComponent:mainBundle];
}

static NSURL *localhostBundleURL()
{
#if TARGET_OS_TV
  return [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=ios&dev=true&minify=false&appletv=true", testFile]];
#else
  return [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=ios&dev=true&minify=false", testFile]];
#endif
}

static NSURL *ipBundleURL()
{
#if TARGET_OS_TV
  return [NSURL URLWithString:[NSString stringWithFormat:@"http://192.168.1.1:8081/%@.bundle?platform=ios&dev=true&minify=false&appletv=true", testFile]];
#else
  return [NSURL URLWithString:[NSString stringWithFormat:@"http://192.168.1.1:8081/%@.bundle?platform=ios&dev=true&minify=false", testFile]];
#endif
}

@implementation NSBundle (RCTBundleURLProviderTests)

- (NSURL *)RCT_URLForResource:(NSString *)name withExtension:(NSString *)ext
{
  // Ensure that test files is always reported as existing
  if ([[name stringByAppendingFormat:@".%@", ext] isEqualToString:mainBundle]) {
    return [[self bundleURL] URLByAppendingPathComponent:mainBundle];
  }
  return [self RCT_URLForResource:name withExtension:ext];
}

@end

@interface RCTBundleURLProviderTests : XCTestCase
@end

@implementation RCTBundleURLProviderTests

- (void)setUp
{
  [super setUp];

  RCTSwapInstanceMethods([NSBundle class],
                         @selector(URLForResource:withExtension:),
                          @selector(RCT_URLForResource:withExtension:));
}

- (void)tearDown
{
  RCTSwapInstanceMethods([NSBundle class],
                         @selector(URLForResource:withExtension:),
                         @selector(RCT_URLForResource:withExtension:));

  [super tearDown];
}

- (void)testBundleURL
{
  RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
  settings.jsLocation = nil;
  NSURL *URL = [settings jsBundleURLForBundleRoot:testFile fallbackResource:nil];
  if (!getenv("CI_USE_PACKAGER")) {
    XCTAssertEqualObjects(URL, mainBundleURL());
  } else {
    XCTAssertEqualObjects(URL, localhostBundleURL());
  }
}

- (void)testLocalhostURL
{
  RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
  settings.jsLocation = @"localhost";
  NSURL *URL = [settings jsBundleURLForBundleRoot:testFile fallbackResource:nil];
  XCTAssertEqualObjects(URL, localhostBundleURL());
}

- (void)testIPURL
{
  RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
  settings.jsLocation = @"192.168.1.1";
  NSURL *URL = [settings jsBundleURLForBundleRoot:testFile fallbackResource:nil];
  XCTAssertEqualObjects(URL, ipBundleURL());
}

@end
