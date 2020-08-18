#include <napi.h>
void setVibrancy(const Napi::CallbackInfo &info) {}

void disableVibrancy(const Napi::CallbackInfo &info) {}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "setVibrancy"),
                Napi::Function::New(env, setVibrancy));
    exports.Set(Napi::String::New(env, "disableVibrancy"),
                Napi::Function::New(env, disableVibrancy));
    return exports;
}

NODE_API_MODULE(vibrancy, Init)
