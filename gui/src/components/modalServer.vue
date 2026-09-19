<template>
  <div class="modal-card" style="max-width: 520px; margin: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">
        {{ $t("configureServer.title", readonly ? 2 : 1) }}
      </p>
      <button
        type="button"
        class="delete"
        aria-label="close"
        @click="$emit('close')"
      ></button>
    </header>
    <section ref="section" :class="{ 'modal-card-body': true }">
      <b-tabs
        v-model="tabChoice"
        position="is-centered"
        class="block"
        type="is-boxed is-twitter same-width-5"
      >
        <b-tab-item label="VMESS">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="v2ray_name"
              v-model="v2ray.ps"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="v2ray_add"
              v-model="v2ray.add"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="v2ray_port"
              v-model="v2ray.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field label="ID" label-position="on-border">
            <b-input
              ref="v2ray_id"
              v-model="v2ray.id"
              required
              placeholder="UserID"
              expanded
            />
          </b-field>
          <b-field label="AlterID" label-position="on-border">
            <b-input
              ref="v2ray_aid"
              v-model="v2ray.aid"
              placeholder="AlterID"
              type="number"
              min="0"
              max="65535"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.security')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.scy" expanded required>
              <option value="auto">{{ $t("configureServer.auto") }}</option>
              <option value="aes-256-gcm">aes-256-gcm</option>
              <option value="aes-128-gcm">aes-128-gcm</option>
              <option value="chacha20-poly1305">chacha20-poly1305</option>
              <option value="xchacha20-poly1305">xchacha20-poly1305</option>
              <option value="none">none</option>
              <option value="zero">zero</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.type !== 'dtls'"
            label="TLS"
            label-position="on-border"
          >
            <b-select
              v-model="v2ray.tls"
              expanded
              @update:model-value="handleNetworkChange"
            >
              <option value="none">{{ $t("setting.options.off") }}</option>
              <option value="tls">tls</option>
            </b-select>
          </b-field>
          <b-field
            v-if="v2ray.tls !== 'none'"
            label="SNI"
            label-position="on-border"
          >
            <b-input
              ref="v2ray_sni"
              v-model="v2ray.sni"
              placeholder="SNI"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.tls === 'tls'"
            :label="$t('configureServer.utlsFingerprint')"
            label-position="on-border"
          >
            <b-select ref="v2ray_fp" v-model="v2ray.fp" expanded>
              <option value="">{{ $t("common.none") }}</option>
              <option value="chrome">chrome</option>
              <option value="firefox">firefox</option>
              <option value="safari">safari</option>
              <option value="ios">ios</option>
              <option value="android">android</option>
              <option value="edge">edge</option>
              <option value="random">random</option>
              <option value="randomized">randomized</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.tls === 'tls'"
            label="Alpn"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.alpn"
              placeholder="h3,h2,http/1.1"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.tls !== 'none'"
            :label="$t('pinnedPeerCertSha256')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.pinnedPeerCertSha256"
              :placeholder="$t('pinnedPeerCertSha256')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.tls !== 'none'"
            :label="$t('verifyPeerCertByName')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.verifyPeerCertByName"
              :placeholder="$t('verifyPeerCertByName')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.network')"
            label-position="on-border"
          >
            <b-select
              ref="v2ray_net"
              v-model="v2ray.net"
              expanded
              required
              @update:model-value="handleNetworkChange"
            >
              <option value="tcp">TCP</option>
              <option value="kcp">mKCP</option>
              <option value="ws">WebSocket</option>
              <option value="h2">HTTP/2</option>
              <option value="grpc">gRPC</option>
              <option value="quic">QUIC</option>
              <option value="xhttp">XHTTP</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'tcp'"
            :label="$t('configureServer.type')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.type" expanded>
              <option value="none">
                {{ $t("configureServer.noObfuscation") }}
              </option>
              <option value="http">
                {{ $t("configureServer.httpObfuscation") }}
              </option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'kcp' || v2ray.net === 'quic'"
            :label="$t('configureServer.type')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.type" expanded>
              <option value="none">
                {{ $t("configureServer.noObfuscation") }}
              </option>
              <option value="srtp">
                {{ $t("configureServer.srtpObfuscation") }}
              </option>
              <option value="utp">
                {{ $t("configureServer.utpObfuscation") }}
              </option>
              <option value="wechat-video">
                {{ $t("configureServer.wechatVideoObfuscation") }}
              </option>
              <option value="dtls">
                {{
                  `${$t("configureServer.dtlsObfuscation")}(${$t("configureServer.forceTLS")})`
                }}
              </option>
              <option value="wireguard">
                {{ $t("configureServer.wireguardObfuscation") }}
              </option>
            </b-select>
          </b-field>
          <b-field
            v-show="
              v2ray.net === 'ws' ||
              v2ray.net === 'h2' ||
              v2ray.net === 'xhttp' ||
              v2ray.tls === 'tls' ||
              (v2ray.net === 'tcp' && v2ray.type === 'http')
            "
            :label="$t('configureServer.hostObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.host"
              :placeholder="$t('configureServer.hostObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="
              v2ray.net === 'ws' ||
              v2ray.net === 'h2' ||
              (v2ray.net === 'tcp' && v2ray.type === 'http')
            "
            :label="$t('configureServer.pathObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.path"
              :placeholder="$t('configureServer.pathObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'ws'"
            :label="$t('configureServer.maxEarlyData')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.maxEarlyData"
              type="number"
              :placeholder="$t('configureServer.maxEarlyData')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'ws'"
            :label="$t('configureServer.earlyDataHeaderName')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.earlyDataHeaderName"
              :placeholder="$t('configureServer.earlyDataHeaderName')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'mkcp' || v2ray.net === 'kcp'"
            :label="$t('configureServer.seedObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.path"
              :placeholder="$t('configureServer.seedObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.serviceName')"
            label-position="on-border"
          >
            <b-input
              ref="v2ray_service_name"
              v-model="v2ray.path"
              type="text"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.multiMode')"
            label-position="on-border"
          >
            <b-switch v-model="v2ray.multiMode">{{
              v2ray.multiMode ? $t("operations.yes") : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.idleTimeout')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.idleTimeout"
              type="number"
              :placeholder="$t('configureServer.idleTimeout')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.healthCheckTimeout')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.healthCheckTimeout"
              type="number"
              :placeholder="$t('configureServer.healthCheckTimeout')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.permitWithoutStream')"
            label-position="on-border"
          >
            <b-switch v-model="v2ray.permitWithoutStream">{{
              v2ray.permitWithoutStream
                ? $t("operations.yes")
                : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.initialWindowsSize')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.initialWindowsSize"
              type="number"
              :placeholder="$t('configureServer.initialWindowsSize')"
              expanded
            />
          </b-field>
          <!-- XHTTP fields (VMess) -->
          <b-field
            v-show="v2ray.net === 'xhttp'"
            :label="$t('configureServer.pathObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.path"
              :placeholder="$t('configureServer.pathObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            :label="$t('configureServer.mode')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.xhttpMode" expanded>
              <option value="auto">auto</option>
              <option value="packet-up">packet-up</option>
              <option value="stream-up">stream-up</option>
              <option value="stream-one">stream-one</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            :label="$t('configureServer.uplinkHttpMethod')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.uplinkHTTPMethod" expanded>
              <option value="">
                {{ $t("configureServer.uplinkDefault") }}
              </option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="noGRPCHeader"
            label-position="on-border"
          >
            <b-switch v-model="v2ray.noGRPCHeader">{{
              v2ray.noGRPCHeader ? $t("operations.yes") : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="noSSEHeader"
            label-position="on-border"
          >
            <b-switch v-model="v2ray.noSSEHeader">{{
              v2ray.noSSEHeader ? $t("operations.yes") : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="scMaxEachPostBytes (From-To)"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.scMaxEachPostBytesFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              v-model="v2ray.scMaxEachPostBytesTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="scMinPostsIntervalMs (From-To)"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.scMinPostsIntervalFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              v-model="v2ray.scMinPostsIntervalTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="scMaxBufferedPosts"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.scMaxBufferedPosts"
              type="number"
              placeholder="scMaxBufferedPosts"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="scStreamUpServerSecs (From-To)"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.scStreamUpServerFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              v-model="v2ray.scStreamUpServerTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xPaddingBytes (From-To)"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.xPaddingBytesFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              v-model="v2ray.xPaddingBytesTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux maxConcurrency (From-To)"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.xmuxMaxConcurFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              v-model="v2ray.xmuxMaxConcurTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux maxConnections (From-To)"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.xmuxMaxConnFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              v-model="v2ray.xmuxMaxConnTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux cMaxReuseTimes (From-To)"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.xmuxCMaxReuseFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              v-model="v2ray.xmuxCMaxReuseTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux hMaxRequestTimes (From-To)"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.xmuxHMaxReqFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              v-model="v2ray.xmuxHMaxReqTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux hMaxReusableSecs (From-To)"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.xmuxHMaxReusableFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              v-model="v2ray.xmuxHMaxReusableTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux hKeepAlivePeriod"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.xmuxHKeepAlive"
              type="number"
              placeholder="hKeepAlivePeriod"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            :label="$t('configureServer.customHeaders')"
            label-position="on-border"
          >
            <div style="width: 100%">
              <div
                v-for="(hdr, idx) in v2ray.xhttpHeaders"
                :key="idx"
                style="display: flex; gap: 4px; margin-bottom: 4px"
              >
                <b-input
                  v-model="hdr.key"
                  :placeholder="$t('configureServer.headerName')"
                  expanded
                />
                <b-input
                  v-model="hdr.value"
                  :placeholder="$t('configureServer.headerValue')"
                  expanded
                />
                <b-button
                  type="is-danger is-light"
                  icon-left="trash-2"
                  size="is-small"
                  @click="v2ray.xhttpHeaders.splice(idx, 1)"
                />
              </div>
              <b-button
                size="is-small"
                icon-left="plus"
                @click="v2ray.xhttpHeaders.push({ key: '', value: '' })"
                >{{ $t("configureServer.addHeader") }}</b-button
              >
            </div>
          </b-field>
          <!-- QUIC -->
          <b-field
            v-show="v2ray.net === 'quic'"
            :label="$t('configureServer.quicSecurity')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.quicSecurity" expanded>
              <option value="none">none</option>
              <option value="aes-128-gcm">aes-128-gcm</option>
              <option value="chacha20-poly1305">chacha20-poly1305</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'quic'"
            :label="$t('configureServer.key')"
            label-position="on-border"
          >
            <b-input
              ref="v2ray_key"
              v-model="v2ray.key"
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
        </b-tab-item>

        <b-tab-item label="VLESS">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="vless_name"
              v-model="v2ray.ps"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="vless_add"
              v-model="v2ray.add"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="vless_port"
              v-model="v2ray.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field label="ID" label-position="on-border">
            <b-input
              ref="vless_id"
              v-model="v2ray.id"
              required
              placeholder="UserID"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.type !== 'dtls'"
            label="TLS"
            label-position="on-border"
          >
            <b-select
              v-model="v2ray.tls"
              expanded
              @update:model-value="handleNetworkChange"
            >
              <option value="none">{{ $t("setting.options.off") }}</option>
              <option value="tls">tls</option>
              <option v-if="variant() === 'xray'" value="reality">
                reality
              </option>
            </b-select>
          </b-field>
          <b-field
            v-if="v2ray.tls !== 'none'"
            label="SNI"
            label-position="on-border"
          >
            <b-input
              ref="vless_sni"
              v-model="v2ray.sni"
              placeholder="SNI"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.tls === 'tls' || v2ray.tls === 'reality'"
            :label="$t('configureServer.utlsFingerprint')"
            label-position="on-border"
          >
            <b-select ref="vless_fp" v-model="v2ray.fp" expanded>
              <option value="">{{ $t("common.none") }}</option>
              <option value="chrome">chrome</option>
              <option value="firefox">firefox</option>
              <option value="safari">safari</option>
              <option value="ios">ios</option>
              <option value="android">android</option>
              <option value="edge">edge</option>
              <option value="random">random</option>
              <option value="randomized">randomized</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.tls === 'tls'"
            label="Alpn"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.alpn"
              placeholder="h3,h2,http/1.1"
              expanded
            />
          </b-field>
          <b-field
            v-if="v2ray.tls !== 'none'"
            label="Flow"
            label-position="on-border"
          >
            <b-input v-model="v2ray.flow" placeholder="Flow" expanded />
          </b-field>
          <b-field
            v-show="v2ray.tls === 'reality'"
            :label="$t('configureServer.realityPublicKey')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.pbk"
              :placeholder="$t('configureServer.realityPublicKey')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.tls === 'reality'"
            :label="$t('configureServer.realityShortId')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.sid"
              :placeholder="$t('configureServer.realityShortId')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.tls === 'reality'"
            :label="$t('configureServer.realitySpiderX')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.spx"
              :placeholder="$t('configureServer.realitySpiderX')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.tls !== 'none'"
            :label="$t('pinnedPeerCertSha256')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.pinnedPeerCertSha256"
              :placeholder="$t('pinnedPeerCertSha256')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.tls !== 'none'"
            :label="$t('verifyPeerCertByName')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.verifyPeerCertByName"
              :placeholder="$t('verifyPeerCertByName')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.network')"
            label-position="on-border"
          >
            <b-select
              ref="vless_net"
              v-model="v2ray.net"
              expanded
              required
              @update:model-value="handleNetworkChange"
            >
              <option value="tcp">TCP</option>
              <option value="kcp">mKCP</option>
              <option value="ws">WebSocket</option>
              <option value="h2">HTTP/2</option>
              <option value="grpc">gRPC</option>
              <option value="quic">QUIC</option>
              <option value="xhttp">XHTTP</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'tcp'"
            :label="$t('configureServer.type')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.type" expanded>
              <option value="none">
                {{ $t("configureServer.noObfuscation") }}
              </option>
              <option value="http">
                {{ $t("configureServer.httpObfuscation") }}
              </option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'kcp' || v2ray.net === 'quic'"
            :label="$t('configureServer.type')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.type" expanded>
              <option value="none">
                {{ $t("configureServer.noObfuscation") }}
              </option>
              <option value="srtp">
                {{ $t("configureServer.srtpObfuscation") }}
              </option>
              <option value="utp">
                {{ $t("configureServer.utpObfuscation") }}
              </option>
              <option value="wechat-video">
                {{ $t("configureServer.wechatVideoObfuscation") }}
              </option>
              <option value="dtls">
                {{
                  `${$t("configureServer.dtlsObfuscation")}(${$t("configureServer.forceTLS")})`
                }}
              </option>
              <option value="wireguard">
                {{ $t("configureServer.wireguardObfuscation") }}
              </option>
            </b-select>
          </b-field>
          <b-field
            v-show="
              v2ray.net === 'ws' ||
              v2ray.net === 'h2' ||
              v2ray.net === 'xhttp' ||
              v2ray.tls === 'tls' ||
              v2ray.tls === 'reality' ||
              (v2ray.net === 'tcp' && v2ray.type === 'http')
            "
            :label="$t('configureServer.hostObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.host"
              :placeholder="$t('configureServer.hostObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="
              v2ray.net === 'ws' ||
              v2ray.net === 'h2' ||
              (v2ray.net === 'tcp' && v2ray.type === 'http')
            "
            :label="$t('configureServer.pathObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.path"
              :placeholder="$t('configureServer.pathObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'ws'"
            :label="$t('configureServer.maxEarlyData')"
            label-position="on-border"
          >
            <b-input
              ref="vless_maxEarlyData"
              v-model="v2ray.maxEarlyData"
              type="number"
              :placeholder="$t('configureServer.maxEarlyData')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'ws'"
            :label="$t('configureServer.earlyDataHeaderName')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.earlyDataHeaderName"
              :placeholder="$t('configureServer.earlyDataHeaderName')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'mkcp' || v2ray.net === 'kcp'"
            :label="$t('configureServer.seedObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.path"
              :placeholder="$t('configureServer.seedObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.serviceName')"
            label-position="on-border"
          >
            <b-input
              ref="vless_service_name"
              v-model="v2ray.path"
              type="text"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.multiMode')"
            label-position="on-border"
          >
            <b-switch v-model="v2ray.multiMode">{{
              v2ray.multiMode ? $t("operations.yes") : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.idleTimeout')"
            label-position="on-border"
          >
            <b-input
              ref="vless_idleTimeout"
              v-model="v2ray.idleTimeout"
              type="number"
              :placeholder="$t('configureServer.idleTimeout')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.healthCheckTimeout')"
            label-position="on-border"
          >
            <b-input
              ref="vless_healthCheckTimeout"
              v-model="v2ray.healthCheckTimeout"
              type="number"
              :placeholder="$t('configureServer.healthCheckTimeout')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.permitWithoutStream')"
            label-position="on-border"
          >
            <b-switch v-model="v2ray.permitWithoutStream">{{
              v2ray.permitWithoutStream
                ? $t("operations.yes")
                : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field
            v-show="v2ray.net === 'grpc'"
            :label="$t('configureServer.initialWindowsSize')"
            label-position="on-border"
          >
            <b-input
              ref="vless_initialWindowsSize"
              v-model="v2ray.initialWindowsSize"
              type="number"
              :placeholder="$t('configureServer.initialWindowsSize')"
              expanded
            />
          </b-field>
          <!-- XHTTP fields (VLESS) -->
          <b-field
            v-show="v2ray.net === 'xhttp'"
            :label="$t('configureServer.pathObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="v2ray.path"
              :placeholder="$t('configureServer.pathObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            :label="$t('configureServer.mode')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.xhttpMode" expanded>
              <option value="auto">auto</option>
              <option value="packet-up">packet-up</option>
              <option value="stream-up">stream-up</option>
              <option value="stream-one">stream-one</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            :label="$t('configureServer.uplinkHttpMethod')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.uplinkHTTPMethod" expanded>
              <option value="">
                {{ $t("configureServer.uplinkDefault") }}
              </option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="noGRPCHeader"
            label-position="on-border"
          >
            <b-switch v-model="v2ray.noGRPCHeader">{{
              v2ray.noGRPCHeader ? $t("operations.yes") : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="noSSEHeader"
            label-position="on-border"
          >
            <b-switch v-model="v2ray.noSSEHeader">{{
              v2ray.noSSEHeader ? $t("operations.yes") : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="scMaxEachPostBytes (From-To)"
            label-position="on-border"
          >
            <b-input
              ref="vless_scMaxEachPostBytesFrom"
              v-model="v2ray.scMaxEachPostBytesFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              ref="vless_scMaxEachPostBytesTo"
              v-model="v2ray.scMaxEachPostBytesTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="scMinPostsIntervalMs (From-To)"
            label-position="on-border"
          >
            <b-input
              ref="vless_scMinPostsIntervalFrom"
              v-model="v2ray.scMinPostsIntervalFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              ref="vless_scMinPostsIntervalTo"
              v-model="v2ray.scMinPostsIntervalTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="scMaxBufferedPosts"
            label-position="on-border"
          >
            <b-input
              ref="vless_scMaxBufferedPosts"
              v-model="v2ray.scMaxBufferedPosts"
              type="number"
              placeholder="scMaxBufferedPosts"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="scStreamUpServerSecs (From-To)"
            label-position="on-border"
          >
            <b-input
              ref="vless_scStreamUpServerFrom"
              v-model="v2ray.scStreamUpServerFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              ref="vless_scStreamUpServerTo"
              v-model="v2ray.scStreamUpServerTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xPaddingBytes (From-To)"
            label-position="on-border"
          >
            <b-input
              ref="vless_xPaddingBytesFrom"
              v-model="v2ray.xPaddingBytesFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              ref="vless_xPaddingBytesTo"
              v-model="v2ray.xPaddingBytesTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux maxConcurrency (From-To)"
            label-position="on-border"
          >
            <b-input
              ref="vless_xmuxMaxConcurFrom"
              v-model="v2ray.xmuxMaxConcurFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              ref="vless_xmuxMaxConcurTo"
              v-model="v2ray.xmuxMaxConcurTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux maxConnections (From-To)"
            label-position="on-border"
          >
            <b-input
              ref="vless_xmuxMaxConnFrom"
              v-model="v2ray.xmuxMaxConnFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              ref="vless_xmuxMaxConnTo"
              v-model="v2ray.xmuxMaxConnTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux cMaxReuseTimes (From-To)"
            label-position="on-border"
          >
            <b-input
              ref="vless_xmuxCMaxReuseFrom"
              v-model="v2ray.xmuxCMaxReuseFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              ref="vless_xmuxCMaxReuseTo"
              v-model="v2ray.xmuxCMaxReuseTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux hMaxRequestTimes (From-To)"
            label-position="on-border"
          >
            <b-input
              ref="vless_xmuxHMaxReqFrom"
              v-model="v2ray.xmuxHMaxReqFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              ref="vless_xmuxHMaxReqTo"
              v-model="v2ray.xmuxHMaxReqTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux hMaxReusableSecs (From-To)"
            label-position="on-border"
          >
            <b-input
              ref="vless_xmuxHMaxReusableFrom"
              v-model="v2ray.xmuxHMaxReusableFrom"
              type="number"
              :placeholder="$t('configureServer.rangeFrom')"
              expanded
            />
            <b-input
              ref="vless_xmuxHMaxReusableTo"
              v-model="v2ray.xmuxHMaxReusableTo"
              type="number"
              :placeholder="$t('configureServer.rangeTo')"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            label="xmux hKeepAlivePeriod"
            label-position="on-border"
          >
            <b-input
              ref="vless_xmuxHKeepAlive"
              v-model="v2ray.xmuxHKeepAlive"
              type="number"
              placeholder="hKeepAlivePeriod"
              expanded
            />
          </b-field>
          <b-field
            v-show="v2ray.net === 'xhttp'"
            :label="$t('configureServer.customHeaders')"
            label-position="on-border"
          >
            <div style="width: 100%">
              <div
                v-for="(hdr, idx) in v2ray.xhttpHeaders"
                :key="idx"
                style="display: flex; gap: 4px; margin-bottom: 4px"
              >
                <b-input
                  v-model="hdr.key"
                  :placeholder="$t('configureServer.headerName')"
                  expanded
                />
                <b-input
                  v-model="hdr.value"
                  :placeholder="$t('configureServer.headerValue')"
                  expanded
                />
                <b-button
                  type="is-danger is-light"
                  icon-left="trash-2"
                  size="is-small"
                  @click="v2ray.xhttpHeaders.splice(idx, 1)"
                />
              </div>
              <b-button
                size="is-small"
                icon-left="plus"
                @click="v2ray.xhttpHeaders.push({ key: '', value: '' })"
                >{{ $t("configureServer.addHeader") }}</b-button
              >
            </div>
          </b-field>
          <!-- QUIC -->
          <b-field
            v-show="v2ray.net === 'quic'"
            :label="$t('configureServer.quicSecurity')"
            label-position="on-border"
          >
            <b-select v-model="v2ray.quicSecurity" expanded>
              <option value="none">none</option>
              <option value="aes-128-gcm">aes-128-gcm</option>
              <option value="chacha20-poly1305">chacha20-poly1305</option>
            </b-select>
          </b-field>
          <b-field
            v-show="v2ray.net === 'quic'"
            :label="$t('configureServer.key')"
            label-position="on-border"
          >
            <b-input
              ref="vless_key"
              v-model="v2ray.key"
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
        </b-tab-item>

        <b-tab-item label="WireGuard">
          <b-field
            :label="$t('configureServer.wireguardName')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_name"
              v-model="wireguard.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardAddress')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_address"
              v-model="wireguard.address"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardPort')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_port"
              v-model="wireguard.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardPublicKey')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_public_key"
              v-model="wireguard.publicKey"
              required
              :placeholder="$t('configureServer.wireguardPublicKey')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardPrivateKey')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_private_key"
              v-model="wireguard.privateKey"
              required
              :placeholder="$t('configureServer.wireguardPrivateKey')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardLocalAddress')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_local_address"
              v-model="wireguard.localAddress"
              :placeholder="
                $t('configureServer.wireguardLocalAddressPlaceholder')
              "
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardDns')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_dns"
              v-model="wireguard.dns"
              :placeholder="$t('dns.colServer')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardMtu')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_mtu"
              v-model="wireguard.mtu"
              type="number"
              placeholder="MTU"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardAllowedIPs')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_allowed_ips"
              v-model="wireguard.allowedIPs"
              placeholder="0.0.0.0/0, ::/0"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardPersistentKeepalive')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_persistent_keepalive"
              v-model="wireguard.persistentKeepalive"
              type="number"
              :placeholder="$t('configureServer.wireguardPersistentKeepalive')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardPreSharedKey')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_pre_shared_key"
              v-model="wireguard.preSharedKey"
              :placeholder="$t('configureServer.wireguardPreSharedKey')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.wireguardEndpoint')"
            label-position="on-border"
          >
            <b-input
              ref="wireguard_endpoint"
              v-model="wireguard.endpoint"
              :placeholder="$t('configureServer.wireguardEndpointPlaceholder')"
              expanded
            />
          </b-field>
        </b-tab-item>

        <b-tab-item label="SS">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="ss_name"
              v-model="ss.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="ss_server"
              v-model="ss.server"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="ss_port"
              v-model="ss.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.password')"
            label-position="on-border"
          >
            <b-input
              ref="ss_password"
              v-model="ss.password"
              required
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.method')"
            label-position="on-border"
          >
            <b-select ref="ss_method" v-model="ss.method" expanded required>
              <option value="2022-blake3-aes-128-gcm">
                2022-blake3-aes-128-gcm
              </option>
              <option value="2022-blake3-aes-256-gcm">
                2022-blake3-aes-256-gcm
              </option>
              <option value="2022-blake3-chacha20-poly1305">
                2022-blake3-chacha20-poly1305
              </option>
              <option value="aes-128-gcm">aes-128-gcm</option>
              <option value="aes-256-gcm">aes-256-gcm</option>
              <option value="chacha20-poly1305">chacha20-poly1305</option>
              <option value="chacha20-ietf-poly1305">
                chacha20-ietf-poly1305
              </option>
              <option value="plain">plain</option>
              <option value="none">none</option>
            </b-select>
          </b-field>
          <b-field
            :label="$t('configureServer.plugin')"
            label-position="on-border"
          >
            <b-select ref="ss_plugin" v-model="ss.plugin" expanded>
              <option value="">{{ $t("setting.options.off") }}</option>
              <option value="simple-obfs">simple-obfs</option>
              <option value="v2ray-plugin">v2ray-plugin</option>
            </b-select>
          </b-field>
          <b-field
            v-if="ss.plugin === 'simple-obfs' || ss.plugin === 'v2ray-plugin'"
            label-position="on-border"
            class="with-icon-alert"
          >
            <template #label>
              {{ $t("configureServer.pluginImpl") }}
              <b-tooltip
                type="is-dark"
                :label="$t('setting.messages.ssPluginImpl')"
                multilined
                position="is-right"
              >
                <b-icon
                  size="is-samll"
                  icon="circle-help"
                  style="
                    position: relative;
                    top: 2px;
                    right: 3px;
                    font-weight: normal;
                  "
                />
              </b-tooltip>
            </template>
            <b-select ref="ss_plugin_impl" v-model="ss.impl" expanded>
              <option value="">{{ $t("setting.options.default") }}</option>
              <option value="chained">chained</option>
              <option value="transport">transport</option>
            </b-select>
          </b-field>
          <b-field
            v-show="ss.plugin === 'simple-obfs'"
            :label="$t('configureServer.obfs')"
            label-position="on-border"
          >
            <b-select ref="ss_obfs" v-model="ss.obfs" expanded>
              <option value="http">http</option>
              <option value="tls">tls</option>
            </b-select>
          </b-field>
          <b-field
            v-show="ss.plugin === 'v2ray-plugin'"
            :label="$t('configureServer.mode')"
            label-position="on-border"
          >
            <b-select ref="ss_mode" v-model="ss.mode" expanded>
              <option value="websocket">websocket</option>
            </b-select>
          </b-field>
          <b-field
            v-show="ss.plugin === 'v2ray-plugin'"
            label="TLS"
            label-position="on-border"
          >
            <b-select ref="ss_tls" v-model="ss.tls" expanded>
              <option value="">{{ $t("setting.options.off") }}</option>
              <option value="tls">tls</option>
            </b-select>
          </b-field>
          <b-field
            v-if="
              (ss.plugin === 'simple-obfs' &&
                (ss.obfs === 'http' || ss.obfs === 'tls')) ||
              ss.plugin === 'v2ray-plugin'
            "
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="ss_host"
              v-model="ss.host"
              :placeholder="`(${$t('common.optional')})`"
              expanded
            />
          </b-field>
          <b-field
            v-if="
              (ss.plugin === 'simple-obfs' && ss.obfs === 'http') ||
              ss.plugin === 'v2ray-plugin'
            "
            :label="$t('configureServer.pathObfuscation')"
            label-position="on-border"
          >
            <b-input ref="ss_path" v-model="ss.path" placeholder="/" expanded />
          </b-field>
          <b-field
            :label="$t('setting.nodeBackend')"
            label-position="on-border"
          >
            <b-select v-model="ss.backend" expanded>
              <option value="">
                {{ $t("setting.options.backendSystemDefault") }}
              </option>
              <option value="v2ray">
                {{ $t("setting.options.backendV2ray") }}
              </option>
            </b-select>
          </b-field>
        </b-tab-item>

        <b-tab-item label="SSR">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="ssr_name"
              v-model="ssr.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="ssr_server"
              v-model="ssr.server"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="ssr_port"
              v-model="ssr.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.password')"
            label-position="on-border"
          >
            <b-input
              ref="ssr_password"
              v-model="ssr.password"
              required
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.method')"
            label-position="on-border"
          >
            <b-select ref="ssr_method" v-model="ssr.method" expanded required>
              <option value="aes-128-cfb">aes-128-cfb</option>
              <option value="aes-192-cfb">aes-192-cfb</option>
              <option value="aes-256-cfb">aes-256-cfb</option>
              <option value="aes-128-ctr">aes-128-ctr</option>
              <option value="aes-192-ctr">aes-192-ctr</option>
              <option value="aes-256-ctr">aes-256-ctr</option>
              <option value="aes-128-ofb">aes-128-ofb</option>
              <option value="aes-192-ofb">aes-192-ofb</option>
              <option value="aes-256-ofb">aes-256-ofb</option>
              <option value="des-cfb">des-cfb</option>
              <option value="bf-cfb">bf-cfb</option>
              <option value="cast5-cfb">cast5-cfb</option>
              <option value="rc4-md5">rc4-md5</option>
              <option value="chacha20">chacha20</option>
              <option value="chacha20-ietf">chacha20-ietf</option>
              <option value="salsa20">salsa20</option>
              <option value="camellia-128-cfb">camellia-128-cfb</option>
              <option value="camellia-192-cfb">camellia-192-cfb</option>
              <option value="camellia-256-cfb">camellia-256-cfb</option>
              <option value="idea-cfb">idea-cfb</option>
              <option value="rc2-cfb">rc2-cfb</option>
              <option value="seed-cfb">seed-cfb</option>
              <option value="none">none</option>
            </b-select>
          </b-field>
          <b-field :label="$t('server.protocol')" label-position="on-border">
            <b-select ref="ssr_proto" v-model="ssr.proto" expanded required>
              <option value="origin">origin</option>
              <option value="verify_sha1">verify_sha1</option>
              <option value="auth_sha1_v4">auth_sha1_v4</option>
              <option value="auth_aes128_md5">auth_aes128_md5</option>
              <option value="auth_aes128_sha1">auth_aes128_sha1</option>
              <option value="auth_chain_a">auth_chain_a</option>
              <option value="auth_chain_b">auth_chain_b</option>
            </b-select>
          </b-field>
          <b-field
            v-if="ssr.proto !== 'origin'"
            :label="$t('configureServer.protocolParam')"
            label-position="on-border"
          >
            <b-input
              ref="ssr_protoParam"
              v-model="ssr.protoParam"
              :placeholder="`(${$t('common.optional')})`"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.obfs')"
            label-position="on-border"
          >
            <b-select ref="ssr_obfs" v-model="ssr.obfs" expanded required>
              <option value="plain">plain</option>
              <option value="http_simple">http_simple</option>
              <option value="http_post">http_post</option>
              <option value="random_head">random_head</option>
              <option value="tls1.2_ticket_auth">tls1.2_ticket_auth</option>
            </b-select>
          </b-field>
          <b-field
            v-if="ssr.obfs !== 'plain'"
            :label="$t('configureServer.obfsParam')"
            label-position="on-border"
          >
            <b-input
              ref="ssr_obfsParam"
              v-model="ssr.obfsParam"
              :placeholder="`(${$t('common.optional')})`"
              expanded
            />
          </b-field>
        </b-tab-item>

        <b-tab-item label="Trojan">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="trojan_name"
              v-model="trojan.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="trojan_server"
              v-model="trojan.server"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="trojan_port"
              v-model="trojan.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.password')"
            label-position="on-border"
          >
            <b-input
              ref="trojan_password"
              v-model="trojan.password"
              required
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
          <b-field :label="$t('server.protocol')" label-position="on-border">
            <b-select
              ref="trojan_method"
              v-model="trojan.method"
              expanded
              required
            >
              <option value="origin">{{ $t("configureServer.origin") }}</option>
              <option value="shadowsocks">shadowsocks</option>
            </b-select>
          </b-field>
          <b-field
            v-if="trojan.method === 'shadowsocks'"
            :label="$t('configureServer.ssCipher')"
            label-position="on-border"
          >
            <b-select
              ref="trojan_ss_cipher"
              v-model="trojan.ssCipher"
              expanded
              required
            >
              <option value="aes-128-gcm">aes-128-gcm</option>
              <option value="aes-256-gcm">aes-256-gcm</option>
              <option value="chacha20-poly1305">chacha20-poly1305</option>
              <option value="chacha20-ietf-poly1305">
                chacha20-ietf-poly1305
              </option>
            </b-select>
          </b-field>
          <b-field
            v-if="trojan.method === 'shadowsocks'"
            :label="$t('configureServer.ssPassword')"
            label-position="on-border"
          >
            <b-input
              ref="trojan_ss_password"
              v-model="trojan.ssPassword"
              required
              :placeholder="$t('configureServer.ssPassword')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('pinnedPeerCertSha256')"
            label-position="on-border"
          >
            <b-input
              v-model="trojan.pinnedPeerCertSha256"
              :placeholder="$t('pinnedPeerCertSha256')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('verifyPeerCertByName')"
            label-position="on-border"
          >
            <b-input
              v-model="trojan.verifyPeerCertByName"
              :placeholder="$t('verifyPeerCertByName')"
              expanded
            />
          </b-field>
          <b-field label="SNI(Peer)" label-position="on-border">
            <b-input v-model="trojan.peer" placeholder="SNI(Peer)" expanded />
          </b-field>
          <b-field
            :label="$t('configureServer.network')"
            label-position="on-border"
          >
            <b-select
              ref="trojan_net"
              v-model="trojan.net"
              expanded
              required
              @update:model-value="handleNetworkChange"
            >
              <option value="tcp">TCP</option>
              <option value="kcp">mKCP</option>
              <option value="ws">WebSocket</option>
              <option value="h2">HTTP/2</option>
              <option value="grpc">gRPC</option>
            </b-select>
          </b-field>
          <b-field
            :label="$t('configureServer.obfs')"
            label-position="on-border"
          >
            <b-select ref="trojan_obfs" v-model="trojan.obfs" expanded required>
              <option value="none">
                {{ $t("configureServer.noObfuscation") }}
              </option>
              <option value="websocket">websocket</option>
            </b-select>
          </b-field>
          <b-field
            v-show="trojan.obfs === 'websocket'"
            :label="$t('configureServer.websocketHost')"
            label-position="on-border"
          >
            <b-input v-model="trojan.host" expanded />
          </b-field>
          <b-field
            v-show="trojan.obfs === 'websocket'"
            :label="$t('configureServer.websocketPath')"
            label-position="on-border"
          >
            <b-input v-model="trojan.path" placeholder="/" expanded />
          </b-field>
          <b-field
            v-show="trojan.net === 'ws' || trojan.net === 'h2'"
            :label="$t('configureServer.hostObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="trojan.host"
              :placeholder="$t('configureServer.hostObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="trojan.tls === 'tls'"
            label="Alpn"
            label-position="on-border"
          >
            <b-input v-model="trojan.alpn" placeholder="h2,http/1.1" expanded />
          </b-field>
          <b-field
            v-show="trojan.net === 'ws' || trojan.net === 'h2'"
            :label="$t('configureServer.pathObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="trojan.path"
              :placeholder="$t('configureServer.pathObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="trojan.net === 'mkcp' || trojan.net === 'kcp'"
            :label="$t('configureServer.seedObfuscation')"
            label-position="on-border"
          >
            <b-input
              v-model="trojan.path"
              :placeholder="$t('configureServer.seedObfuscation')"
              expanded
            />
          </b-field>
          <b-field
            v-show="trojan.net === 'grpc'"
            :label="$t('configureServer.serviceName')"
            label-position="on-border"
          >
            <b-input
              ref="trojan_service_name"
              v-model="trojan.path"
              type="text"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('setting.nodeBackend')"
            label-position="on-border"
          >
            <b-select v-model="trojan.backend" expanded>
              <option value="">
                {{ $t("setting.options.backendSystemDefault") }}
              </option>
              <option value="v2ray">
                {{ $t("setting.options.backendV2ray") }}
              </option>
            </b-select>
          </b-field>
        </b-tab-item>

        <b-tab-item label="Juicity">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="juicity_name"
              v-model="juicity.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="juicity_server"
              v-model="juicity.server"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="juicity_port"
              v-model="juicity.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field label="UUID" label-position="on-border">
            <b-input
              ref="juicity_uuid"
              v-model="juicity.uuid"
              required
              placeholder="UUID"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.password')"
            label-position="on-border"
          >
            <b-input
              ref="juicity_password"
              v-model="juicity.password"
              required
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.congestionControl')"
            label-position="on-border"
          >
            <b-select ref="juicity_cc" v-model="juicity.cc" expanded required>
              <option value="bbr">bbr</option>
            </b-select>
          </b-field>
          <b-field label="SNI" label-position="on-border">
            <b-input v-model="juicity.sni" placeholder="SNI" expanded />
          </b-field>
          <b-field
            :label="$t('configureServer.pinnedCertchainSha256')"
            label-position="on-border"
          >
            <b-input
              v-model="juicity.pinnedCertchainSha256"
              :placeholder="$t('configureServer.pinnedCertchainSha256')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.allowInsecure')"
            label-position="on-border"
          >
            <b-switch v-model="juicity.allowInsecure">{{
              juicity.allowInsecure ? $t("operations.yes") : $t("operations.no")
            }}</b-switch>
          </b-field>
        </b-tab-item>

        <b-tab-item label="Tuic">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="tuic_name"
              v-model="tuic.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="tuic_server"
              v-model="tuic.server"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="tuic_port"
              v-model="tuic.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field label="UUID" label-position="on-border">
            <b-input
              ref="tuic_uuid"
              v-model="tuic.uuid"
              required
              placeholder="UUID"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.password')"
            label-position="on-border"
          >
            <b-input
              ref="tuic_password"
              v-model="tuic.password"
              required
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.congestionControl')"
            label-position="on-border"
          >
            <b-select ref="tuic_cc" v-model="tuic.cc" expanded required>
              <option value="bbr">bbr</option>
            </b-select>
          </b-field>
          <b-field
            :label="$t('pinnedPeerCertSha256')"
            label-position="on-border"
          >
            <b-input
              v-model="tuic.pinnedPeerCertSha256"
              :placeholder="$t('pinnedPeerCertSha256')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('verifyPeerCertByName')"
            label-position="on-border"
          >
            <b-input
              v-model="tuic.verifyPeerCertByName"
              :placeholder="$t('verifyPeerCertByName')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.allowInsecure')"
            label-position="on-border"
          >
            <b-switch v-model="tuic.allowInsecure">{{
              tuic.allowInsecure ? $t("operations.yes") : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field label-position="on-border">
            <template #label>{{ $t("configureServer.disableSni") }}</template>
            <b-select
              ref="tuic_disable_sni"
              v-model="tuic.disableSni"
              expanded
              required
            >
              <option :value="false">{{ $t("operations.no") }}</option>
              <option :value="true">
                {{ $t("operations.yes") }}
              </option>
            </b-select>
          </b-field>
          <b-field
            v-if="tuic.disableSni === false"
            label="SNI"
            label-position="on-border"
          >
            <b-input v-model="tuic.sni" placeholder="SNI" expanded />
          </b-field>
          <b-field label="ALPN" label-position="on-border">
            <b-input v-model="tuic.alpn" placeholder="h3" expanded />
          </b-field>
          <b-field label-position="on-border">
            <template #label>{{ $t("configureServer.udpRelayMode") }}</template>
            <b-select
              ref="tuic_udp_relay_mode"
              v-model="tuic.udpRelayMode"
              expanded
              required
            >
              <option value="native">native</option>
              <option value="quic">quic</option>
            </b-select>
          </b-field>
        </b-tab-item>

        <b-tab-item label="Hysteria2">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="hysteria2_name"
              v-model="hysteria2.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="hysteria2_server"
              v-model="hysteria2.server"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="hysteria2_port"
              v-model="hysteria2.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.password')"
            label-position="on-border"
          >
            <b-input
              ref="hysteria2_password"
              v-model="hysteria2.password"
              required
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('pinnedPeerCertSha256')"
            label-position="on-border"
          >
            <b-input
              v-model="hysteria2.pinnedPeerCertSha256"
              :placeholder="$t('pinnedPeerCertSha256')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('verifyPeerCertByName')"
            label-position="on-border"
          >
            <b-input
              v-model="hysteria2.verifyPeerCertByName"
              :placeholder="$t('verifyPeerCertByName')"
              expanded
            />
          </b-field>
          <b-field label="SNI" label-position="on-border">
            <b-input v-model="hysteria2.sni" placeholder="SNI" expanded />
          </b-field>
          <b-field
            :label="$t('configureServer.obfs')"
            label-position="on-border"
          >
            <b-select v-model="hysteria2.obfs" expanded required>
              <option value="none">none</option>
              <option value="salamander">salamander</option>
            </b-select>
          </b-field>
          <b-field
            v-if="hysteria2.obfs !== 'none'"
            :label="$t('configureServer.obfsPassword')"
            label-position="on-border"
          >
            <b-input
              v-model="hysteria2.obfsPassword"
              :placeholder="$t('configureServer.obfsPassword')"
              expanded
            />
          </b-field>
        </b-tab-item>

        <b-tab-item label="HTTP">
          <b-field :label="$t('server.protocol')" label-position="on-border">
            <b-select v-model="http.protocol" expanded>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </b-select>
          </b-field>
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="http_name"
              v-model="http.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="http_host"
              v-model="http.host"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="http_port"
              v-model="http.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.username')"
            label-position="on-border"
          >
            <b-input
              ref="http_username"
              v-model="http.username"
              :placeholder="$t('configureServer.username')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.password')"
            label-position="on-border"
          >
            <b-input
              ref="http_password"
              v-model="http.password"
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
        </b-tab-item>

        <b-tab-item label="SOCKS5">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="socks5_name"
              v-model="socks5.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="socks5_host"
              v-model="socks5.host"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="socks5_port"
              v-model="socks5.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.username')"
            label-position="on-border"
          >
            <b-input
              ref="socks5_username"
              v-model="socks5.username"
              :placeholder="$t('configureServer.username')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.password')"
            label-position="on-border"
          >
            <b-input
              ref="socks5_password"
              v-model="socks5.password"
              :placeholder="$t('configureServer.password')"
              expanded
            />
          </b-field>
        </b-tab-item>

        <b-tab-item label="AnyTLS">
          <b-field
            :label="$t('configureServer.servername')"
            label-position="on-border"
          >
            <b-input
              ref="anytls_name"
              v-model="anytls.name"
              :placeholder="$t('configureServer.servername')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.host')"
            label-position="on-border"
          >
            <b-input
              ref="anytls_host"
              v-model="anytls.host"
              required
              :placeholder="$t('configureServer.host')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.port')"
            label-position="on-border"
          >
            <b-input
              ref="anytls_port"
              v-model="anytls.port"
              required
              :placeholder="$t('configureServer.port')"
              type="number"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.auth')"
            label-position="on-border"
          >
            <b-input
              ref="anytls_auth"
              v-model="anytls.auth"
              required
              :placeholder="$t('configureServer.authKey')"
              expanded
            />
          </b-field>
          <b-field label="SNI(Peer)" label-position="on-border">
            <b-input
              ref="anytls_sni"
              v-model="anytls.sni"
              :placeholder="`SNI / Peer (${$t('common.optional')})`"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('pinnedPeerCertSha256')"
            label-position="on-border"
          >
            <b-input
              v-model="anytls.pinnedPeerCertSha256"
              :placeholder="$t('pinnedPeerCertSha256')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('verifyPeerCertByName')"
            label-position="on-border"
          >
            <b-input
              v-model="anytls.verifyPeerCertByName"
              :placeholder="$t('verifyPeerCertByName')"
              expanded
            />
          </b-field>
          <b-field
            :label="$t('configureServer.allowInsecure')"
            label-position="on-border"
          >
            <b-switch v-model="anytls.allowInsecure">{{
              anytls.allowInsecure ? $t("operations.yes") : $t("operations.no")
            }}</b-switch>
          </b-field>
          <b-field
            :label="$t('configureServer.minIdleSession')"
            label-position="on-border"
          >
            <b-input v-model="anytls.minIdleSession" type="number" expanded />
          </b-field>
        </b-tab-item>
      </b-tabs>
    </section>
    <footer v-if="!readonly" class="modal-card-foot flex-end">
      <button class="button" type="button" @click="$emit('close')">
        {{ $t("operations.cancel") }}
      </button>
      <button class="button is-primary" @click="handleClickSubmit">
        {{ $t("operations.saveApply") }}
      </button>
    </footer>
  </div>
</template>

<script>
import { handleResponse } from "@/assets/js/utils";
import { generateShareLink, parseShareLink } from "@/lib/serverCodec";
import { Base64 } from "js-base64";

export default {
  name: "ModalServer",
  emits: ["submit", "close"],
  props: {
    which: {
      type: Object,
      default() {
        return null;
      },
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    vlessVersion: 0,
    v2ray: {
      ps: "",
      add: "",
      port: "",
      id: "",
      flow: "",
      aid: "",
      net: "tcp",
      type: "none",
      host: "",
      path: "",
      tls: "none",
      quicSecurity: "none",
      fp: "",
      pbk: "",
      sid: "",
      spx: "",
      alpn: "",
      scy: "auto",
      v: "",
      pinnedPeerCertSha256: "",
      verifyPeerCertByName: "",
      protocol: "vmess",
      key: "none",
      xhttpMode: "auto",
      xhttpHeaders: [],
      noGRPCHeader: false,
      noSSEHeader: false,
      uplinkHTTPMethod: "",
      scMaxEachPostBytesFrom: "",
      scMaxEachPostBytesTo: "",
      scMinPostsIntervalFrom: "",
      scMinPostsIntervalTo: "",
      scMaxBufferedPosts: "",
      scStreamUpServerFrom: "",
      scStreamUpServerTo: "",
      xPaddingBytesFrom: "",
      xPaddingBytesTo: "",
      xmuxMaxConcurFrom: "",
      xmuxMaxConcurTo: "",
      xmuxMaxConnFrom: "",
      xmuxMaxConnTo: "",
      xmuxCMaxReuseFrom: "",
      xmuxCMaxReuseTo: "",
      xmuxHMaxReqFrom: "",
      xmuxHMaxReqTo: "",
      xmuxHMaxReusableFrom: "",
      xmuxHMaxReusableTo: "",
      xmuxHKeepAlive: "",
      maxEarlyData: "",
      earlyDataHeaderName: "",
      multiMode: false,
      idleTimeout: "",
      healthCheckTimeout: "",
      permitWithoutStream: false,
      initialWindowsSize: "",
    },
    ss: {
      method: "2022-blake3-aes-128-gcm",
      plugin: "",
      obfs: "http",
      tls: "",
      path: "/",
      mode: "websocket",
      host: "",
      password: "",
      server: "",
      port: "",
      name: "",
      protocol: "ss",
      impl: "",
      backend: "",
    },
    ssr: {
      method: "aes-128-cfb",
      password: "",
      server: "",
      port: "",
      name: "",
      proto: "origin",
      protoParam: "",
      obfs: "plain",
      obfsParam: "",
      protocol: "ssr",
    },
    trojan: {
      name: "",
      server: "",
      peer: "" /* tls sni */,
      host: "" /* websocket host */,
      path: "" /* websocket path */,
      pinnedPeerCertSha256: "",
      verifyPeerCertByName: "",
      port: "",
      password: "",
      method: "origin" /* shadowsocks */,
      ssCipher: "aes-128-gcm",
      ssPassword: "",
      net: "tcp",
      obfs: "none" /* websocket */,
      protocol: "trojan",
      backend: "",
    },
    juicity: {
      name: "",
      server: "",
      port: "",
      sni: "",
      cc: "bbr",
      uuid: "",
      password: "",
      pinnedCertchainSha256: "",
      allowInsecure: false,
      protocol: "juicity",
    },
    tuic: {
      name: "",
      server: "",
      port: "",
      sni: "",
      cc: "bbr",
      uuid: "",
      password: "",
      pinnedPeerCertSha256: "",
      verifyPeerCertByName: "",
      allowInsecure: false,
      disableSni: false,
      alpn: "h3",
      udpRelayMode: "native",
      protocol: "tuic",
    },
    hysteria2: {
      name: "",
      server: "",
      port: "",
      password: "",
      sni: "",
      obfs: "none",
      obfsPassword: "",
      pinnedPeerCertSha256: "",
      verifyPeerCertByName: "",
      protocol: "hysteria2",
    },
    http: {
      username: "",
      password: "",
      host: "",
      port: "",
      protocol: "http",
      name: "",
    },
    socks5: {
      username: "",
      password: "",
      host: "",
      port: "",
      protocol: "socks5",
      name: "",
    },
    anytls: {
      name: "",
      host: "",
      port: "",
      auth: "",
      sni: "",
      pinnedPeerCertSha256: "",
      verifyPeerCertByName: "",
      allowInsecure: false,
      minIdleSession: "",
      protocol: "anytls",
    },
    wireguard: {
      protocol: "wireguard",
      name: "",
      address: "",
      port: "",
      publicKey: "",
      privateKey: "",
      localAddress: "",
      dns: "",
      mtu: "",
      allowedIPs: "",
      persistentKeepalive: "",
      preSharedKey: "",
      endpoint: "",
    },
    tabChoice: 0,
  }),
  mounted() {
    if (this.which !== null) {
      this.$axios({
        url: apiRoot + "/sharingAddress",
        method: "get",
        params: {
          touch: this.which,
        },
      }).then((res) => {
        handleResponse(
          res,
          this,
          () => {
            if (
              res.data.data.sharingAddress.toLowerCase().startsWith("vmess://")
            ) {
              this.v2ray = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 0;
            } else if (
              res.data.data.sharingAddress.toLowerCase().startsWith("vless://")
            ) {
              this.v2ray = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 1;
            } else if (
              res.data.data.sharingAddress
                .toLowerCase()
                .startsWith("wireguard://")
            ) {
              this.wireguard = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 2;
            } else if (
              res.data.data.sharingAddress.toLowerCase().startsWith("ss://")
            ) {
              this.ss = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 3;
            } else if (
              res.data.data.sharingAddress.toLowerCase().startsWith("ssr://")
            ) {
              this.ssr = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 4;
            } else if (
              res.data.data.sharingAddress
                .toLowerCase()
                .startsWith("trojan://") ||
              res.data.data.sharingAddress
                .toLowerCase()
                .startsWith("trojan-go://")
            ) {
              this.trojan = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 5;
            } else if (
              res.data.data.sharingAddress
                .toLowerCase()
                .startsWith("juicity://")
            ) {
              this.juicity = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 6;
            } else if (
              res.data.data.sharingAddress.toLowerCase().startsWith("tuic://")
            ) {
              this.tuic = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 7;
            } else if (
              res.data.data.sharingAddress
                .toLowerCase()
                .startsWith("hysteria2://") ||
              res.data.data.sharingAddress.toLowerCase().startsWith("hy2://")
            ) {
              this.hysteria2 = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 8;
            } else if (
              res.data.data.sharingAddress
                .toLowerCase()
                .startsWith("http://") ||
              res.data.data.sharingAddress.toLowerCase().startsWith("https://")
            ) {
              this.http = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 9;
            } else if (
              res.data.data.sharingAddress.toLowerCase().startsWith("socks5://")
            ) {
              this.socks5 = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 10;
            } else if (
              res.data.data.sharingAddress.toLowerCase().startsWith("anytls://")
            ) {
              this.anytls = this.resolveURL(res.data.data.sharingAddress);
              this.tabChoice = 11;
            }
            this.$nextTick(() => {
              if (this.readonly) {
                this.$refs.section
                  .querySelectorAll("input, textarea")
                  .forEach((x) => (x.readOnly = "readOnly"));
                this.$refs.section.querySelectorAll("select").forEach((x) => {
                  // a subscription node may carry a value the option list
                  // does not offer (e.g. a newer transport); show it raw
                  const opt = x.querySelector(`option[value="${x.value}"]`);
                  const text = opt ? opt.textContent : x.value;
                  x.outerHTML = `<input type="text" class="input" readonly="readonly" value="${text}">`;
                });
              }
            });
          },
          null,
          "sharing.failed",
        );
      });
    }
  },
  watch: {
    tabChoice(val) {
      if (val === 0) this.v2ray.protocol = "vmess";
      if (val === 1) this.v2ray.protocol = "vless";
    },
  },
  methods: {
    variant() {
      const v = (localStorage["variant"] || "v2ray").toLowerCase();
      // v2raya_core is the merged xray-based core; treat it as the revised "xray" variant.
      return v === "v2rayacore" ? "xray" : v;
    },
    handleV2rayProtocolSwitch() {
      // protocol is now driven by tab selection
    },
    resolveURL(url) {
      return parseShareLink(url);
    },
    generateURL(srcObj) {
      return generateShareLink(srcObj);
    },
    handleNetworkChange() {
      this.v2ray.type = "none";
      if (this.v2ray.tls === "none" && this.v2ray.net === "grpc") {
        this.$buefy.toast.open({
          message: this.$t("setting.messages.grpcShouldWithTls"),
          type: "is-warning",
          position: "is-top",
          duration: 5000,
        });
        this.$nextTick(() => {
          this.v2ray.tls = "tls";
        });
      }
    },
    async handleClickSubmit() {
      let valid = true;
      for (let k in this.$refs) {
        if (!this.$refs.hasOwnProperty(k)) {
          continue;
        }
        if (this.tabChoice === 0 && !k.startsWith("v2ray_")) {
          continue;
        }
        if (this.tabChoice === 1 && !k.startsWith("vless_")) {
          continue;
        }
        if (this.tabChoice === 2 && !k.startsWith("wireguard_")) {
          continue;
        }
        if (this.tabChoice === 3 && !k.startsWith("ss_")) {
          continue;
        }
        if (this.tabChoice === 4 && !k.startsWith("ssr_")) {
          continue;
        }
        if (this.tabChoice === 5 && !k.startsWith("trojan_")) {
          continue;
        }
        if (this.tabChoice === 6 && !k.startsWith("juicity_")) {
          continue;
        }
        if (this.tabChoice === 7 && !k.startsWith("tuic_")) {
          continue;
        }
        if (this.tabChoice === 8 && !k.startsWith("hysteria2_")) {
          continue;
        }
        if (this.tabChoice === 9 && !k.startsWith("http_")) {
          continue;
        }
        if (this.tabChoice === 10 && !k.startsWith("socks5_")) {
          continue;
        }
        if (this.tabChoice === 11 && !k.startsWith("anytls_")) {
          continue;
        }
        let x = this.$refs[k];
        if (!x) {
          continue;
        }
        if (
          x.$el.offsetParent && // is visible
          x.hasOwnProperty("checkHtml5Validity") &&
          typeof x.checkHtml5Validity === "function" &&
          !x.checkHtml5Validity()
        ) {
          console.error("validate failed", x);
          valid = false;
        }
      }
      if (!valid) {
        return;
      }
      let coded = "";
      // 0: vmess, 1: vless, 2: wireguard, 3: ss, 4: ssr, 5: trojan, 6: juicity, 7: tuic, 8: hysteria2, 9: http, 10: socks5, 11: anytls
      if (this.tabChoice === 0) {
        coded = this.generateURL(this.v2ray);
      } else if (this.tabChoice === 1) {
        coded = this.generateURL(this.v2ray);
      } else if (this.tabChoice === 2) {
        // wireguard://address:port?key=value#name
        coded = this.generateURL(this.wireguard);
      } else if (this.tabChoice === 3) {
        coded = this.generateURL(this.ss);
      } else if (this.tabChoice === 4) {
        coded = this.generateURL(this.ssr);
      } else if (this.tabChoice === 5) {
        coded = this.generateURL(this.trojan);
      } else if (this.tabChoice === 6) {
        coded = this.generateURL(this.juicity);
      } else if (this.tabChoice === 7) {
        coded = this.generateURL(this.tuic);
      } else if (this.tabChoice === 8) {
        coded = this.generateURL(this.hysteria2);
      } else if (this.tabChoice === 9) {
        coded = this.generateURL(this.http);
      } else if (this.tabChoice === 10) {
        coded = this.generateURL(this.socks5);
      } else if (this.tabChoice === 11) {
        coded = this.generateURL(this.anytls);
      }
      this.$emit("submit", coded);
    },
  },
};
</script>

<style lang="scss">
.is-twitter .is-active a {
  color: #4099ff !important;
}

.same-width-5 li {
  min-width: 5em;
  width: unset !important;
}
</style>
