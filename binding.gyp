{
    "targets": [
        {
          "target_name": "vibrancy-wrapper",
          "cflags!": [ "-fno-exceptions" ],
          "cflags": [ "-std=c++11" ],
          "cflags_cc!": [ "-fno-exceptions" ],
          'include_dirs': [
              "<!@(node -p \"require('node-addon-api').include\")"
          ],
          'libraries': [],
          'dependencies': [
              "<!(node -p \"require('node-addon-api').gyp\")"
          ],
          'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
          'conditions': [
                ["OS=='win'", {
                    "sources": [
                      "src/main-win32.cc"
                    ]
                }],
                ['OS != "win"', {
                    "sources": [
                      "src/main.cc"
                    ]
                }]
            ]

        }
    ]
}
